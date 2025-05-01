/**
 * Status route to check API connectivity
 */
const express = require('express');
const router = express.Router();
const moment = require('moment');
const path = require('path');
const fs = require('fs');
const db = require('../utils/dbConfig');

/**
 * @route GET /api/status
 * @desc Get API status information
 * @access Public
 */
router.get('/', async (req, res) => {
    try {
        // Basic status info
        const statusInfo = {
            status: 'online',
            timestamp: new Date().toISOString(),
            uptime: process.uptime() + ' seconds',
            server: {
                node: process.version,
                platform: process.platform
            }
        };
        
        // Get database status
        try {
            const dbCheckStart = Date.now();
            const [results] = await db.query('SELECT 1 as db_online');
            const dbResponseTime = Date.now() - dbCheckStart;
            
            statusInfo.database = {
                connected: results[0].db_online === 1,
                responseTime: dbResponseTime + 'ms'
            };
        } catch (dbErr) {
            statusInfo.database = {
                connected: false,
                error: dbErr.message
            };
        }
        
        // Get application status
        try {
            const [applications] = await db.query('SELECT COUNT(*) as count FROM applications');
            const [pendingApplications] = await db.query('SELECT COUNT(*) as count FROM applications WHERE status = "pending"');
            const [acceptedApplications] = await db.query('SELECT COUNT(*) as count FROM applications WHERE status = "accepted"');
            const [rejectedApplications] = await db.query('SELECT COUNT(*) as count FROM applications WHERE status = "rejected"');
            
            statusInfo.applications = {
                total: applications[0].count,
                pending: pendingApplications[0].count,
                accepted: acceptedApplications[0].count,
                rejected: rejectedApplications[0].count
            };
        } catch (appErr) {
            statusInfo.applications = {
                error: 'Could not retrieve application statistics'
            };
        }
        
        // Get job posting status
        try {
            // First check if job_listings table exists
            const [jobsTable] = await db.query(`
                SELECT COUNT(*) AS table_exists 
                FROM information_schema.tables 
                WHERE table_schema = DATABASE() 
                AND table_name = 'job_listings'
            `);
            
            if (jobsTable[0].table_exists) {
                // Get total count of jobs
                const [jobs] = await db.query('SELECT COUNT(*) as count FROM job_listings');
                
                // Check if is_active column exists
                const [columns] = await db.query(`
                    SELECT COUNT(*) AS column_exists 
                    FROM information_schema.columns 
                    WHERE table_schema = DATABASE() 
                    AND table_name = 'job_listings' 
                    AND column_name = 'is_active'
                `);
                
                statusInfo.jobs = {
                    total: jobs[0].count
                };
                
                // Only query active jobs if the column exists
                if (columns[0].column_exists) {
                    const [activeJobs] = await db.query('SELECT COUNT(*) as count FROM job_listings WHERE is_active = 1');
                    statusInfo.jobs.active = activeJobs[0].count;
                } else {
                    // Try status column as an alternative
                    const [activeJobs] = await db.query('SELECT COUNT(*) as count FROM job_listings WHERE status = "Active"');
                    statusInfo.jobs.active = activeJobs[0].count;
                }
            } else {
                statusInfo.jobs = {
                    error: 'Jobs table does not exist'
                };
            }
        } catch (jobErr) {
            statusInfo.jobs = {
                error: 'Could not retrieve job statistics'
            };
        }
        
        res.status(200).json(statusInfo);
    } catch (error) {
        res.status(500).json({ 
            status: 'error',
            message: 'Server status check failed',
            error: error.message
        });
    }
});

/**
 * @route GET /api/status/health
 * @desc Simple health check endpoint
 * @access Public
 */
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

module.exports = router; 