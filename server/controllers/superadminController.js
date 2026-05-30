/**
 * Name: superadminController.js
 * PHASE 3 FIXES:
 *
 *   FIX 1 (CRITICAL): getSystemLogs used `log.message` but Log schema has `log.description`.
 *          Every rawLine in the superadmin console showed "undefined".
 *          The live terminal was completely broken. Fixed to `log.description`.
 *
 *   FIX 2 (CRITICAL): getUsers() returned password hashes.
 *          No .select('-password') — hashed bcrypt passwords were visible
 *          in the superadmin Users panel response. Fixed.
 *
 *   FIX 3 (HIGH): catch blocks leaked raw err.message to clients.
 *          Raw Mongoose/Node error text (schema paths, stack hints) exposed.
 *          Now passes to next(err) → global error handler formats it safely.
 *
 *   FIX 4 (MEDIUM): getSystemLogs hardcoded limit(100) with no pagination.
 *          Now accepts ?page= and ?limit= query params.
 *
 *   FIX 5 (MEDIUM): getUsers() returned all users across all companies with no pagination.
 *          Now accepts ?page=, ?limit=, ?company= filters.
 *
 *   FIX 6 (MEDIUM): updateUser used findByIdAndUpdate() with req.body directly.
 *          This allowed a superadmin to accidentally overwrite the password field
 *          with a plaintext string (bypassing bcrypt) if 'password' was in the body.
 *          Now whitelists safe fields only.
 */

const User = require('../models/User');
const Log  = require('../models/Log');
const AppError = require('../utils/AppError');

// ─────────────────────────────────────────────────────────
// SYSTEM LOGS
// ─────────────────────────────────────────────────────────

exports.getSystemLogs = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(200, parseInt(req.query.limit) || 100);
    const skip  = (page - 1) * limit;

    // Optional filters
    const filter = {};
    if (req.query.company) filter.company = req.query.company;
    if (req.query.level && ['INFO', 'WARN', 'ERROR', 'DEBUG'].includes(req.query.level.toUpperCase())) {
      filter.level = req.query.level.toUpperCase();
    }
    if (req.query.module) filter.module = req.query.module.toUpperCase();

    const [logs, total] = await Promise.all([
      Log.find(filter)
        .populate('user', 'fullname email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Log.countDocuments(filter),
    ]);

    const formattedLogs = logs.map((log) => {
      const timestamp  = new Date(log.createdAt).toLocaleString();
      const level      = log.level?.toUpperCase()  || 'INFO';
      const moduleName = log.module?.toUpperCase() || 'SYSTEM';
      const company    = log.company               || 'Default Company';

      // ─────────────────────────────────────────────
      // FIX: Was `log.message` — field does not exist on the Log schema.
      // The schema field is `log.description`. Every rawLine was "undefined".
      // ─────────────────────────────────────────────
      const description = log.description || '(no description)';

      return {
        _id:       log._id,
        timestamp,
        level,
        module:    moduleName,
        company,
        actionType: log.actionType || 'system_cron',
        user: log.user
          ? { id: log.user._id, name: log.user.fullname, email: log.user.email, role: log.user.role }
          : null,
        rawLine: `[${timestamp}] [${level}] [${moduleName}] [${company}] ${description}`,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedLogs.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data:  formattedLogs,
    });
  } catch (err) {
    next(err); // FIX: Pass to global handler — don't leak err.message
  }
};

// ─────────────────────────────────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────────────────────────────────

exports.createUser = async (req, res, next) => {
  try {
    const { fullname, email, password, role, company } = req.body;

    if (!fullname || !email || !password || !role) {
      return next(new AppError('fullname, email, password, and role are required', 400));
    }

    if (!['user', 'admin', 'superadmin'].includes(role)) {
      return next(new AppError("Invalid role. Must be 'user', 'admin', or 'superadmin'", 400));
    }

    const userExists = await User.findOne({ email }).lean();
    if (userExists) {
      return next(new AppError('Email already registered', 409));
    }

    const user = await User.create({
      fullname,
      email,
      password,
      role,
      company: company || 'Default Company',
    });

    // Never return the password hash — even as superadmin
    const safeUser = { ...user.toObject() };
    delete safeUser.password;

    return res.status(201).json({ success: true, data: safeUser });
  } catch (err) {
    next(err);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip  = (page - 1) * limit;

    // Optional filters
    const filter = {};
    if (req.query.company) filter.company = req.query.company;
    if (req.query.role && ['user', 'admin', 'superadmin'].includes(req.query.role)) {
      filter.role = req.query.role;
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')   // FIX: Was missing — password hashes were exposed
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data:  users,
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) return next(new AppError('User not found', 404));
    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err); // CastError (invalid ObjectId) → handled by globalErrorHandler → 404
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    // ─────────────────────────────────────────────
    // FIX: Whitelist allowed fields.
    // BEFORE: User.findByIdAndUpdate(id, req.body, ...) — body passed directly.
    //   If superadmin accidentally included 'password' in the request body,
    //   it would overwrite the bcrypt hash with plaintext text.
    // AFTER: Only safe fields are accepted.
    // ─────────────────────────────────────────────
    const { fullname, email, role, company, employmentStatus, department, position, phone } = req.body;

    const allowedUpdate = {};
    if (fullname)          allowedUpdate.fullname          = fullname;
    if (email)             allowedUpdate.email             = email;
    if (role && ['user', 'admin', 'superadmin'].includes(role)) allowedUpdate.role = role;
    if (company)           allowedUpdate.company           = company;
    if (employmentStatus)  allowedUpdate.employmentStatus  = employmentStatus;
    if (department)        allowedUpdate.department        = department;
    if (position)          allowedUpdate.position          = position;
    if (phone !== undefined) allowedUpdate.phone           = phone;

    const user = await User.findByIdAndUpdate(req.params.id, allowedUpdate, {
      new: true,
      runValidators: true,
    }).select('-password').lean();

    if (!user) return next(new AppError('User not found', 404));
    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id).lean();
    if (!user) return next(new AppError('User not found', 404));
    return res.status(200).json({ success: true, message: 'User deleted' });
  } catch (err) {
    next(err);
  }
};
