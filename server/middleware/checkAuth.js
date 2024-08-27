// Middleware to check if user is logged in
function checkAuth(req, res, next) {
    if (req.session.userId) {
        next(); // User is logged in, proceed to the next middleware
    } else {
        res.json({ status: 'unauthorized', message: 'Unauthorized, please login' });
    }
  }
  
  module.exports = checkAuth;