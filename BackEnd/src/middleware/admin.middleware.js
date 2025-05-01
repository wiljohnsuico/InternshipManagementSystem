/**
 * Middleware to ensure the user has Admin role
 */
const adminMiddleware = (req, res, next) => {
    try {
        // TEMPORARY: REMOVE IN PRODUCTION
        // Bypass authentication for testing
        if (!req.user) {
            console.log('DEVELOPMENT MODE: Creating mock admin user');
            req.user = {
                user_id: 1,
                role: 'Admin',
                email: 'admin@test.com'
            };
            return next();
        }

        if (req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        // User is an admin, proceed to the next middleware/route handler
        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during admin authorization'
        });
    }
};

module.exports = adminMiddleware; 