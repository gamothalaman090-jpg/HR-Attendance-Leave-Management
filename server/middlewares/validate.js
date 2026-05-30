/**
 * Name: validate.js
 * Purpose: Reusable request validation middleware using Joi.
 * PHASE 1 — NEW FILE
 *
 * Usage:
 *   router.post('/register', validate(registerSchema), register);
 *
 * Returns 422 with field-level errors so the frontend can display
 * exactly which field failed without leaking server internals.
 */

const Joi = require('joi');

/**
 * Middleware factory — wraps a Joi schema and validates req.body.
 * @param {Joi.ObjectSchema} schema
 * @returns Express middleware
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,      // Return ALL errors, not just the first
    stripUnknown: true,     // Remove any fields not in the schema (prevents prototype pollution)
    convert: true,
  });

  if (error) {
    const errors = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message.replace(/['"]/g, ''), // Strip Joi's quotes from messages
    }));

    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  req.body = value; // Replace req.body with sanitized + stripped value
  return next();
};

module.exports = validate;
