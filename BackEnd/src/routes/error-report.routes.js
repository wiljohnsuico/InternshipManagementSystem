/**
 * Error reporting routes
 * Allows frontend to report errors for analysis
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Set up error log directory
const LOG_DIR = path.join(__dirname, '../../logs');
const CLIENT_ERROR_LOG = path.join(LOG_DIR, 'client-errors.log');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * @route POST /api/errors/report
 * @desc Record client-side errors
 * @access Public
 */
router.post('/report', (req, res) => {
    try {
        const {
            error,
            context = '',
            stack,
            userAgent,
            url,
            timestamp
        } = req.body;
        
        if (!error) {
            return res.status(400).json({
                success: false,
                message: 'Error details required'
            });
        }
        
        // Format the log entry
        const logEntry = `
[${timestamp || new Date().toISOString()}] CLIENT ERROR
URL: ${url || 'Not provided'}
Context: ${context || 'Not provided'}
User Agent: ${userAgent || 'Not provided'}
Error: ${error}
${stack ? `Stack: ${stack}` : ''}
------------------------------
`;
        
        // Write to log file
        fs.appendFile(CLIENT_ERROR_LOG, logEntry, (writeErr) => {
            if (writeErr) {
                console.error('Failed to write client error to log:', writeErr);
            }
        });
        
        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.log('Received client error report:', {
                error,
                context,
                url
            });
        }
        
        return res.status(200).json({
            success: true,
            message: 'Error report received'
        });
    } catch (error) {
        console.error('Error processing client error report:', error);
        
        return res.status(500).json({
            success: false,
            message: 'Failed to process error report'
        });
    }
});

/**
 * @route GET /api/errors/recent
 * @desc Get recent client errors (admin only)
 * @access Private/Admin
 */
router.get('/recent', (req, res) => {
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Unauthorized access'
        });
    }
    
    try {
        // Check if log file exists
        if (!fs.existsSync(CLIENT_ERROR_LOG)) {
            return res.status(200).json({
                success: true,
                data: [],
                message: 'No error logs found'
            });
        }
        
        // Read the last 100 lines of the log file
        const MAX_LINES = 100;
        const logContent = fs.readFileSync(CLIENT_ERROR_LOG, 'utf8');
        const logEntries = logContent.split('------------------------------').filter(Boolean);
        
        // Get the most recent entries (up to MAX_LINES)
        const recentEntries = logEntries.slice(-MAX_LINES).map(entry => entry.trim());
        
        return res.status(200).json({
            success: true,
            data: recentEntries,
            count: recentEntries.length
        });
    } catch (error) {
        console.error('Error retrieving client error logs:', error);
        
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve error logs'
        });
    }
});

module.exports = router; 