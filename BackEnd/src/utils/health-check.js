/**
 * Health Check Utility
 * 
 * Provides functions to check system and database health
 */

const db = require('../config/database');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Health status storage
let healthStatus = {
    database: {
        status: 'unknown',
        lastChecked: null,
        error: null
    },
    system: {
        status: 'ok',
        uptime: 0,
        memory: {
            free: 0,
            total: 0
        },
        cpu: 0
    },
    storage: {
        status: 'unknown',
        free: 0,
        total: 0
    }
};

// Check database connection
async function checkDatabaseHealth() {
    try {
        // Use the testConnection function we added to the database module
        const isConnected = await db.testConnection();
        
        healthStatus.database = {
            status: isConnected ? 'ok' : 'error',
            lastChecked: new Date(),
            error: isConnected ? null : 'Failed to connect to database'
        };
        
        return isConnected;
    } catch (error) {
        console.error('Database health check failed:', error);
        
        healthStatus.database = {
            status: 'error',
            lastChecked: new Date(),
            error: error.message
        };
        
        return false;
    }
}

// Check system health (CPU, memory)
function checkSystemHealth() {
    try {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const uptime = os.uptime();
        
        // Calculate average CPU load across all cores
        const cpuCount = os.cpus().length;
        const loadAvg = os.loadavg()[0]; // 1 minute load average
        const cpuUsagePercent = (loadAvg / cpuCount) * 100;
        
        healthStatus.system = {
            status: 'ok',
            uptime,
            memory: {
                free: freeMemory,
                total: totalMemory,
                usedPercent: ((totalMemory - freeMemory) / totalMemory) * 100
            },
            cpu: cpuUsagePercent
        };
        
        return true;
    } catch (error) {
        console.error('System health check failed:', error);
        
        healthStatus.system = {
            status: 'error',
            error: error.message
        };
        
        return false;
    }
}

// Check storage health
function checkStorageHealth() {
    try {
        // Check if uploads directory exists and is writable
        const uploadsDir = path.join(__dirname, '../../uploads');
        
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // Try to write a test file
        const testFilePath = path.join(uploadsDir, '.health-check-test');
        fs.writeFileSync(testFilePath, 'test', { flag: 'w' });
        
        // Check if we can read it back
        const content = fs.readFileSync(testFilePath, 'utf8');
        
        // Clean up test file
        fs.unlinkSync(testFilePath);
        
        healthStatus.storage = {
            status: content === 'test' ? 'ok' : 'error',
            writable: true
        };
        
        return content === 'test';
    } catch (error) {
        console.error('Storage health check failed:', error);
        
        healthStatus.storage = {
            status: 'error',
            error: error.message,
            writable: false
        };
        
        return false;
    }
}

// Run all health checks
async function checkHealth() {
    const dbHealth = await checkDatabaseHealth();
    const systemHealth = checkSystemHealth();
    const storageHealth = checkStorageHealth();
    
    const isHealthy = dbHealth && systemHealth && storageHealth;
    
    return {
        healthy: isHealthy,
        timestamp: new Date(),
        database: healthStatus.database,
        system: healthStatus.system,
        storage: healthStatus.storage
    };
}

// Get current health status without running checks
function getHealthStatus() {
    return {
        healthy: 
            healthStatus.database.status === 'ok' && 
            healthStatus.system.status === 'ok' &&
            healthStatus.storage.status === 'ok',
        timestamp: new Date(),
        database: healthStatus.database,
        system: healthStatus.system,
        storage: healthStatus.storage
    };
}

// Setup interval to periodically check health
let healthCheckInterval = null;

function startHealthMonitoring(intervalMs = 60000) {
    if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
    }
    
    // Initial health check
    checkHealth();
    
    // Setup interval for regular health checks
    healthCheckInterval = setInterval(async () => {
        await checkHealth();
    }, intervalMs);
    
    return healthCheckInterval;
}

function stopHealthMonitoring() {
    if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
        healthCheckInterval = null;
    }
}

module.exports = {
    checkHealth,
    getHealthStatus,
    startHealthMonitoring,
    stopHealthMonitoring
}; 