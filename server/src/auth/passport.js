const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const authService = require('../services/auth.service');

passport.use(
  new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const user = await authService.verifyCredentials(email, password);
      // Same message for unknown email and wrong password (no user enumeration)
      if (!user) return done(null, false, { message: 'Invalid email or password' });
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    done(null, (await authService.findById(id)) || false);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
