/**
 * Name: User.js
 * PHASE 1 FIXES:
 *   - Bcrypt salt rounds bumped from 10 → 12 (production recommendation)
 *   - Added resetPasswordToken + resetPasswordExpire fields (forgotPassword was broken without these)
 *   - Added authProvider field (was referenced in authController but missing from schema)
 *   - Added compound index on email for faster lookups
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: [true, 'Please add a full name'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email'],
  },
  password: {
    type: String,
    minlength: 8,       // FIX: Raised from 6 → 8 (NIST recommendation)
    select: false,
  },

  // ─────────────────────────────────────────────
  // FIX: authProvider was used in authController.googleOAuth()
  // but was never defined in the schema — causing silent save failures.
  // ─────────────────────────────────────────────
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local',
  },
  providerId: {
    type: String,
    default: null,
    select: false,
  },

  role: {
    type: String,
    enum: ['user', 'admin', 'superadmin'],
    default: 'user',
  },
  company: {
    type: String,
    required: [true, 'Please provide a company name'],
    default: 'Default Company',
    trim: true,
  },
  department: {
    type: String,
    required: [true, 'Please provide a department'],
    trim: true,
    default: 'Unassigned',
  },
  position: {
    type: String,
    required: [true, 'Please provide a position title'],
    trim: true,
    default: 'Staff Employee',
  },
  phone: {
    type: String,
    default: '',
  },
  employmentStatus: {
    type: String,
    enum: ['pending', 'active', 'inactive', 'suspended', 'terminated'],
    default: 'active',
    lowercase: true,
  },
  profilePicture: {
    type: String,
    default: '',
  },
  onboarded: {
    type: Boolean,
    default: false,
  },
  leaveBalances: {
    annual:   { allotted: { type: Number, default: 20 }, left: { type: Number, default: 20 } },
    sick:     { allotted: { type: Number, default: 12 }, left: { type: Number, default: 12 } },
    personal: { allotted: { type: Number, default: 7  }, left: { type: Number, default: 7  } },
  },

  // ─────────────────────────────────────────────
  // FIX: These fields are required for forgotPassword to work.
  // Previously, authController generated a resetToken but had
  // nowhere to store it — making password reset permanently broken.
  // ─────────────────────────────────────────────
  resetPasswordToken: {
    type: String,
    select: false,
  },
  resetPasswordExpire: {
    type: Date,
    select: false,
  },
}, {
  timestamps: true,
});

// ─── Indexes ─────────────────────────────────
userSchema.index({ company: 1, role: 1, employmentStatus: 1 });
userSchema.index({ email: 1 });   // FIX: Explicit email index for login queries

// ─────────────────────────────────────────────
// FIX: Bcrypt salt rounds 10 → 12
// Each extra round doubles hashing time for attackers.
// 10 rounds ≈ 65ms | 12 rounds ≈ 300ms — acceptable UX, much stronger.
// ─────────────────────────────────────────────
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  const salt = await bcrypt.genSalt(12);   // WAS: 10
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// ─────────────────────────────────────────────
// FIX: New method to generate + store a hashed reset token.
// The raw token is emailed to the user; only the hash is stored
// in the DB — same pattern as Passport.js and major auth libraries.
// ─────────────────────────────────────────────
userSchema.methods.getResetPasswordToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');

  // Store hashed version in DB (never store raw tokens)
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  // Token expires in 15 minutes
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return rawToken; // Return the raw token to email to the user
};

module.exports = mongoose.model('User', userSchema);
