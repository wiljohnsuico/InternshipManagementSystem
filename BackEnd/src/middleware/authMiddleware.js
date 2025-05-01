// Re-export auth middleware with the name expected by notification.routes.js
const { authMiddleware } = require('./auth.middleware');
 
// Export with the name expected in notification.routes.js
module.exports = {
  authenticateToken: authMiddleware
}; 