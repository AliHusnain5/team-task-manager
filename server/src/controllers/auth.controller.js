const passport = require('../auth/passport');
const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');
const config = require('../config');

const logIn = (req, user) =>
  new Promise((resolve, reject) => req.login(user, (err) => (err ? reject(err) : resolve())));

exports.register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  await logIn(req, user);
  res.status(201).json({ user });
});

exports.login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return next(new HttpError(401, (info && info.message) || 'Invalid credentials'));
    logIn(req, user)
      .then(() => res.json({ user }))
      .catch(next);
  })(req, res, next);
};

exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie(config.session.cookieName);
      res.json({ message: 'Logged out' });
    });
  });
};

exports.me = (req, res) => res.json({ user: req.user });
