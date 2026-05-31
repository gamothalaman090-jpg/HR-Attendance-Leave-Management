const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized — no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // FIX: .lean() — req.user is read-only everywhere, no need for Mongoose Document
    const user = await User.findById(decoded.id).select('-password').lean();

    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authorized — user account no longer exists' });
    }

    if (['suspended', 'terminated'].includes(user.employmentStatus)) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact your administrator.',
      });
    }

    user.id = user._id.toString();
    req.user = user;
    return next();
  } catch (error) {
    const isExpired = error.name === 'TokenExpiredError';
    const message = isExpired
      ? 'Your session has expired. Please log in again.'
      : 'Invalid token. Please log in again.';

    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[AUTH] Token verification failed: ${error.name} — ${error.message}`);
    }

    return res.status(401).json({ success: false, message });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied — your role (${req.user.role}) does not have permission for this resource`,
      });
    }
    return next();
  };
};

module.exports = { protect, authorize };
