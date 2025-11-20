// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
}

// Middleware to check if user is authorized (whitelisted)
function isAuthorized(req, res, next) {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  res.status(403).json({ error: 'Not authorized' });
}

module.exports = {
  isAuthenticated,
  isAuthorized,
};
