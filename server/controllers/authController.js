/**
 * Name: authController.js
 * PHASE 1 FIXES:
 *   - CRITICAL: Role escalation prevented — public register() can no longer set superadmin
 *   - CRITICAL: forgotPassword() now stores hashed token + expiry (was permanently broken)
 *   - NEW:      resetPassword() endpoint added (was missing entirely)
 *   - FIX:      Login audit log now uses 'auth_login' actionType (was 'profile_update')
 *   - FIX:      Failed logins are now logged with 'auth_failure' + WARN level
 *   - FIX:      JWT_EXPIRE respected from env (document token should be short, e.g. 15m)
 *   - FIX:      Nodemailer transporter is reused (not recreated per request)
 */

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { createAuditLog } = require('../utils/logger');

// ─────────────────────────────────────────────
// FIX: Create the transporter ONCE at module load.
// Previously it was recreated on every forgotPassword call — wasteful.
// ─────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m',
  });
};

// ─────────────────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { fullname, email, password, department, position, company } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Please add a password' });
    }

    // ─────────────────────────────────────────────
    // FIX: ROLE ESCALATION PREVENTION
    // BEFORE: role = req.body.role || 'admin'
    //   → Any user could POST { role: 'superadmin' } and get superadmin access.
    // AFTER: Public registration can only create 'admin' accounts.
    //   Superadmin accounts must be provisioned manually/via seeder.
    //   Employee ('user') accounts are created by admins via /api/admin/users.
    // ─────────────────────────────────────────────
    const targetRole = 'admin'; // HARDCODED — never trust client-supplied role

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    let targetCompany = company?.trim();
    if (!targetCompany || targetCompany === 'Default Company') {
      targetCompany = fullname ? `${fullname.trim()}'s Org` : 'Default Company';
    }

    const user = await User.create({
      fullname,
      email,
      password,
      role: targetRole,
      company: targetCompany,
      department: department || 'Unassigned',
      position: position || 'Staff Employee',
      employmentStatus: 'active',
      onboarded: false,
    });

    const token = generateToken(user._id);

    req.user = { company: user.company };
    await createAuditLog(
      user._id,
      'profile_update',
      `New admin registered: ${user.fullname} (${user.email}) — company: ${user.company}`,
      req,
      'INFO',
      'AUTH'
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      data: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        company: user.company,
        department: user.department,
        position: user.position,
        profilePicture: user.profilePicture || '',
        onboarded: user.onboarded,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      // ─────────────────────────────────────────────
      // FIX: Log failed login attempts (was not being tracked at all)
      // Using 'auth_failure' actionType which exists in the Log schema
      // ─────────────────────────────────────────────
      if (user) {
        await createAuditLog(
          user._id,
          'auth_failure',
          `Failed login attempt for: ${email}`,
          req,
          'WARN',
          'SECURITY'
        );
      }
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.employmentStatus === 'pending') {
      return res.status(403).json({ success: false, message: 'Your account is pending admin approval' });
    }

    if (['suspended', 'terminated'].includes(user.employmentStatus)) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated' });
    }

    const token = generateToken(user._id);

    req.user = { company: user.company };
    // ─────────────────────────────────────────────
    // FIX: Was using actionType 'profile_update' for login events.
    // Now correctly uses 'auth_login' which is defined in the Log schema enum.
    // ─────────────────────────────────────────────
    await createAuditLog(
      user._id,
      'auth_login',          // WAS: 'profile_update'
      `User logged in successfully. Role: ${user.role.toUpperCase()}`,
      req,
      'INFO',
      'AUTH'
    );

    res.status(200).json({
      success: true,
      token,
      data: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        company: user.company,
        department: user.department,
        position: user.position,
        profilePicture: user.profilePicture || '',
        onboarded: user.onboarded,
      },
      message: 'Login successful',
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────
// GOOGLE OAUTH
// ─────────────────────────────────────────────────────────
exports.googleOAuth = async (req, res, next) => {
  try {
    const { email, fullname, providerId, profilePicture } = req.body;

    if (!email || !providerId || !fullname) {
      return res.status(400).json({
        success: false,
        message: 'Incomplete OAuth data profile payload',
      });
    }

    let user = await User.findOne({ email });
    let isNewRegistration = false;

    if (user) {
      if (user.authProvider === 'local') {
        user.authProvider = 'google';
        user.providerId = providerId;
        if (!user.profilePicture && profilePicture) user.profilePicture = profilePicture;
        await user.save();
      }
    } else {
      const targetCompany = req.body.company || 'Default Company';
      const employeeCount = await User.countDocuments({
        role: 'user',
        employmentStatus: { $ne: 'terminated' },
        company: targetCompany,
      });

      if (employeeCount >= 10) {
        return res.status(400).json({
          success: false,
          message: 'Tier Limit Reached: This company has reached the maximum of 10 employees.',
        });
      }

      isNewRegistration = true;
      user = await User.create({
        fullname,
        email,
        authProvider: 'google',
        providerId,
        profilePicture: profilePicture || '',
        role: 'user',
        company: targetCompany,
        department: 'Unassigned',
        position: 'Staff Employee',
        employmentStatus: 'pending',
        onboarded: true,
      });
    }

    if (user.employmentStatus === 'pending') {
      return res.status(403).json({ success: false, message: 'Your account is pending admin approval' });
    }

    if (['suspended', 'terminated'].includes(user.employmentStatus)) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated' });
    }

    const token = generateToken(user._id);

    req.user = { company: user.company };
    await createAuditLog(
      user._id,
      'auth_login',
      isNewRegistration
        ? `New user provisioned via Google OAuth: ${user.fullname} (${user.email})`
        : `User authenticated via Google OAuth: ${user._id}`,
      req,
      'INFO',
      'AUTH'
    );

    return res.status(isNewRegistration ? 201 : 200).json({
      success: true,
      message: isNewRegistration ? 'OAuth profile provisioned' : 'OAuth login successful',
      token,
      data: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        company: user.company,
        department: user.department,
        position: user.position,
        profilePicture: user.profilePicture || '',
        onboarded: user.onboarded,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    // ─────────────────────────────────────────────
    // SECURITY NOTE: Don't reveal whether the email exists.
    // Always return the same message regardless (prevents email enumeration).
    // ─────────────────────────────────────────────
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If that email exists, a reset link has been sent.',
      });
    }

    // ─────────────────────────────────────────────
    // FIX: Previously used crypto.randomBytes() but NEVER saved the token
    // to the database — so it was impossible to verify it later.
    // Now uses User.getResetPasswordToken() which stores the hashed token.
    // ─────────────────────────────────────────────
    const rawToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    const resetUrl = `${clientOrigin}/reset-password?token=${rawToken}`;

    try {
      await transporter.sendMail({
        from: `"HR System" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Password Reset Request — Action Required',
        html: `
          <p>Hi ${user.fullname},</p>
          <p>You requested a password reset. Click the link below (expires in 15 minutes):</p>
          <a href="${resetUrl}" style="font-weight:bold">Reset My Password</a>
          <p>If you did not request this, please ignore this email.</p>
        `,
      });
    } catch (emailError) {
      // Roll back the token if email failed
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      console.error('Email send failed:', emailError.message);
      return res.status(500).json({ success: false, message: 'Email could not be sent' });
    }

    await createAuditLog(user._id, 'profile_update',
      `Password reset link dispatched to: ${user.email}`, req, 'WARN', 'SECURITY');

    res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────
// RESET PASSWORD  ← NEW (was completely missing)
// Route: PUT /api/auth/reset-password
// Body: { token: string, newPassword: string }
// ─────────────────────────────────────────────────────────
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    // Hash the incoming raw token to compare with what's stored
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    await createAuditLog(user._id, 'profile_update',
      `Password successfully reset for: ${user.email}`, req, 'WARN', 'SECURITY');

    res.status(200).json({ success: true, message: 'Password reset successful. Please log in.' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    if (req.user?.id) {
      await createAuditLog(req.user.id, 'auth_login',
        'User session closed (Logged Out).', req, 'INFO', 'AUTH');
    }
    res.status(200).json({ success: true, message: 'Logout successful' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────
// UPDATE PROFILE
// ─────────────────────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (req.body.fullname) user.fullname = req.body.fullname;
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    if (req.body.department !== undefined && req.user.role === 'admin') {
      user.department = req.body.department;
    }

    if (req.body.email && req.body.email !== user.email) {
      const emailExists = await User.findOne({ email: req.body.email });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
      user.email = req.body.email;
    }

    if (req.file?.path) user.profilePicture = req.file.path;

    await user.save();

    await createAuditLog(req.user.id, 'profile_update',
      `${user.fullname} updated their profile${req.file ? ' (including avatar)' : ''}.`,
      req, 'INFO', 'AUTH');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id, fullname: user.fullname, email: user.email,
        phone: user.phone || '', profilePicture: user.profilePicture,
        role: user.role, company: user.company, department: user.department,
        position: user.position, onboarded: user.onboarded,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────
// CHANGE PASSWORD
// ─────────────────────────────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new passwords' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'This account uses third-party login. Use the forgot password flow to set a password.',
      });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect current password' });
    }

    user.password = newPassword;
    await user.save();

    await createAuditLog(req.user.id, 'profile_update',
      `${user.fullname} changed their password.`, req, 'WARN', 'SECURITY');

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────
// ONBOARD USER
// ─────────────────────────────────────────────────────────
exports.onboardUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.onboarded = true;
    await user.save();

    await createAuditLog(req.user.id, 'profile_update',
      'User completed onboarding flow.', req, 'INFO', 'AUTH');

    res.status(200).json({
      success: true,
      message: 'Onboarding completed',
      data: {
        id: user._id, fullname: user.fullname, email: user.email,
        role: user.role, company: user.company,
        profilePicture: user.profilePicture || '', onboarded: user.onboarded,
      },
    });
  } catch (error) {
    next(error);
  }
};
