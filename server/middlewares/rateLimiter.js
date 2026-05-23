/**
 * Name: rateLimiter.js
 * Purpose: Global and targeted request throttling to prevent API abuse and brute-force attacks.
 * Dependencies: express-rate-limit
 * Author: Ian
 * Location: server/middlewares/rateLimiter.js
 * Created: 2026-05-22
 * Last Updated: 2026-05-23
 */

const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV === 'development';

// In dev mode, skip rate limiting entirely (express-rate-limit v7+ treats max:0 as "block all")
const passthrough = (_req, _res, next) => next();

exports.globalLimiter = isDev ? passthrough : rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests originating from this IP address. Please slow down and try again after 15 minutes.'
    }
});

exports.authLimiter = isDev ? passthrough : rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many authentication attempts detected. This IP address has been temporarily throttled for security safety. Please try again in an hour.'
    }
});