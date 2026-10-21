const rateLimit = require('express-rate-limit');
const config = require('../config');

// Slows down password guessing on login/register.
// Limit is per IP; behind a shared proxy many users can share one IP, so keep it generous.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again in a few minutes.' },
});

module.exports = { authLimiter };
