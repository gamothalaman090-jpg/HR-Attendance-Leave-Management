const Joi = require('joi');

const passwordRule = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .message('Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number');

exports.registerSchema = Joi.object({
  fullname: Joi.string().trim().min(2).max(100).required()
    .messages({ 'string.empty': 'Full name is required' }),

  email: Joi.string().trim().email().lowercase().required()
    .messages({ 'string.email': 'Please provide a valid email address' }),

  password: passwordRule.required(),

  company: Joi.string().trim().max(100).optional(),
  department: Joi.string().trim().max(100).optional(),
  position: Joi.string().trim().max(100).optional(),

  // FIX: 'role' is intentionally excluded from this schema.
  // Even if a client sends { role: 'superadmin' }, stripUnknown:true removes it.
});

exports.loginSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required()
    .messages({ 'string.email': 'Please provide a valid email address' }),

  password: Joi.string().min(1).max(128).required()
    .messages({ 'string.empty': 'Password is required' }),
});

exports.forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required()
    .messages({ 'string.email': 'Please provide a valid email address' }),
});

exports.resetPasswordSchema = Joi.object({
  token: Joi.string().hex().length(64).required()
    .messages({ 'string.length': 'Invalid reset token format' }),

  newPassword: passwordRule.required(),
});

exports.changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(1).required()
    .messages({ 'string.empty': 'Current password is required' }),

  newPassword: passwordRule.required(),
});

exports.googleOAuthSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required(),
  fullname: Joi.string().trim().min(2).max(100).required(),
  providerId: Joi.string().required(),
  profilePicture: Joi.string().uri().optional().allow(''),
  company: Joi.string().trim().max(100).optional(),
});
