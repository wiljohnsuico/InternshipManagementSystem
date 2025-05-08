/**
 * Status route to check API connectivity
 */
const express = require('express');
const router = express.Router();
const healthCheck = require('../utils/health-check');

// Initialize health monitoring
healthCheck.startHealthMonitoring(30000); // Check every 30 seconds

/**
 * @route GET /api/status
 * @desc Get API status information
 * @access Public
 */
router.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API server is running',
        timestamp: new Date().toISOString()
    });
});

/**
 * @route GET /api/status/health
 * @desc Simple health check endpoint
 * @access Public
 */
router.get('/health', async (req, res) => {
    try {
        // Use quick status if query parameter is set to avoid blocking operations
        if (req.query.quick === 'true') {
            const status = healthCheck.getHealthStatus();
            return res.status(status.healthy ? 200 : 503).json(status);
        }
        
        // Run full health check
        const status = await healthCheck.checkHealth();
        
        res.status(status.healthy ? 200 : 503).json(status);
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            healthy: false,
            timestamp: new Date(),
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Readiness probe - check if service is fully ready to serve traffic
router.get('/ready', async (req, res) => {
    try {
        const status = healthCheck.getHealthStatus();
        
        // Ready if database connection is working
        if (status.database.status === 'ok') {
            return res.status(200).json({
                ready: true,
                message: 'Service is ready',
                timestamp: new Date().toISOString()
            });
        }
        
        // If database seems down, verify with a real check
        const fullHealth = await healthCheck.checkHealth();
        if (fullHealth.database.status === 'ok') {
            return res.status(200).json({
                ready: true,
                message: 'Service is ready',
                timestamp: new Date().toISOString()
            });
        }
        
        // If still down, return not ready
        res.status(503).json({
            ready: false,
            message: 'Service is not ready - database unavailable',
            timestamp: new Date().toISOString(),
            details: fullHealth.database
        });
    } catch (error) {
        console.error('Readiness check error:', error);
        res.status(500).json({
            ready: false,
            message: 'Error during readiness check',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// Debug endpoint for getting detailed server information
// Only available in development
router.get('/debug', (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({
            success: false,
            message: 'Debug endpoint only available in development mode'
        });
    }
    
    const status = healthCheck.getHealthStatus();
    const serverInfo = {
        ...status,
        environment: process.env.NODE_ENV,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        nodePath: process.execPath,
        pid: process.pid,
        versions: process.versions
    };
    
    res.status(200).json(serverInfo);
});

module.exports = router; 