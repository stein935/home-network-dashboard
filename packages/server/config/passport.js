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
        prompt: 'consent', // Force consent screen to always get refresh token
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log('[OAuth Strategy] Processing authentication');
          const googleId = profile.id;
          const email = profile.emails[0].value;
          console.log('[OAuth Strategy] Email:', email);
          console.log('[OAuth Strategy] Has access token:', !!accessToken);
          console.log('[OAuth Strategy] Has refresh token:', !!refreshToken);

          // Check if user exists in whitelist by email
          let user = User.findByEmail(email);

          if (!user) {
            // User not in whitelist - deny access
            console.log(
              `[OAuth Strategy] Access denied for non-whitelisted user: ${email}`
            );
            return done(null, false, {
              message: 'User not authorized. Contact admin for access.',
            });
          }

          console.log('[OAuth Strategy] User found in whitelist:', user.email);

          // Store/update google_id on first login or if it changed
          if (!user.google_id || user.google_id !== googleId) {
            User.updateGoogleId(user.id, googleId);
            user.google_id = googleId;
          }

          // Store OAuth tokens for Calendar API access
          if (accessToken) {
            User.updateGoogleTokens(user.id, accessToken, refreshToken);
            console.log('[OAuth Strategy] Updated tokens');
            if (!refreshToken) {
              console.warn(
                '[OAuth Strategy] WARNING: No refresh token received. User may need to revoke access and re-authenticate.'
              );
            }
          }

          // Update last login timestamp
          User.updateLastLogin(user.id);

          console.log(
            `[OAuth Strategy] User authenticated successfully: ${email} (${user.role})`
          );
          return done(null, user);
        } catch (error) {
          console.error('[OAuth Strategy] Error:', error);
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
