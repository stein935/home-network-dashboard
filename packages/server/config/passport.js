const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

function setupPassport() {
  // Configure Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        accessType: 'offline',
        prompt: 'consent',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const googleId = profile.id;
          const email = profile.emails[0].value;

          // Check if user exists in whitelist by email
          let user = User.findByEmail(email);

          if (!user) {
            // User not in whitelist - deny access
            console.log(`Access denied for non-whitelisted user: ${email}`);
            return done(null, false, {
              message: 'User not authorized. Contact admin for access.',
            });
          }

          // Store/update google_id on first login or if it changed
          if (!user.google_id || user.google_id !== googleId) {
            User.updateGoogleId(user.id, googleId);
            user.google_id = googleId;
          }

          // Store OAuth tokens for Calendar API access
          if (accessToken) {
            User.updateGoogleTokens(user.id, accessToken, refreshToken);
          }

          // Update last login timestamp
          User.updateLastLogin(user.id);

          console.log(`User authenticated: ${email} (${user.role})`);
          return done(null, user);
        } catch (error) {
          console.error('Error in Google OAuth strategy:', error);
          return done(error, null);
        }
      }
    )
  );

  // Serialize user to store in session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser((id, done) => {
    try {
      const user = User.findById(id);
      done(null, user);
    } catch (error) {
      console.error('Error deserializing user:', error);
      done(error, null);
    }
  });
}

module.exports = setupPassport;
