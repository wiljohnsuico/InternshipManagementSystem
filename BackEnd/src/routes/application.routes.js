const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Initialize upload directories
const ensureUploadDirectoriesExist = () => {
    const uploadDir = path.join(process.cwd(), 'BackEnd', 'uploads', 'applications').replace(/\//g, '\\');
    console.log('Checking upload directory on server startup:', uploadDir);
    
    try {
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
            console.log('Created upload directory on server startup:', uploadDir);
        } else {
            console.log('Upload directory already exists');
            
            // Test write permissions by creating and removing a test file
            const testFile = path.join(uploadDir, 'test.txt');
            try {
                fs.writeFileSync(testFile, 'test');
                fs.unlinkSync(testFile);
                console.log('Upload directory is writable');
            } catch (e) {
                console.error('Upload directory exists but is not writable:', e.message);
            }
        }
    } catch (e) {
        console.error('Error creating upload directory on server startup:', e);
    }
    
    // Also ensure that a fallback directory exists
    const fallbackDir = path.join(process.cwd(), 'temp_uploads');
    try {
        if (!fs.existsSync(fallbackDir)) {
            fs.mkdirSync(fallbackDir, { recursive: true });
            console.log('Created fallback upload directory:', fallbackDir);
        }
    } catch (e) {
        console.error('Error creating fallback directory:', e);
    }
};

// Run on server startup
ensureUploadDirectoriesExist();

// Helper function to get sanitized file path for storage
const getSanitizedFilePath = (filename) => {
    // Store just the filename, not the full path
    return filename;
};

// Helper to safely clean up temp files
const cleanupTempFiles = (files) => {
    if (!files) return;
    
    console.log('Cleaning up temporary files');
    
    // Handle resume file
    if (files.resume_file && files.resume_file[0] && files.resume_file[0].path) {
        try {
            if (fs.existsSync(files.resume_file[0].path)) {
                fs.unlinkSync(files.resume_file[0].path);
                console.log(`Deleted temp file: ${files.resume_file[0].path}`);
            }
        } catch (err) {
            console.error(`Failed to delete temp file ${files.resume_file[0].path}:`, err);
        }
    }
    
    // Handle supporting docs
    if (files.supporting_docs) {
        files.supporting_docs.forEach(doc => {
            if (doc.path) {
                try {
                    if (fs.existsSync(doc.path)) {
                        fs.unlinkSync(doc.path);
                        console.log(`Deleted temp file: ${doc.path}`);
                    }
                } catch (err) {
                    console.error(`Failed to delete temp file ${doc.path}:`, err);
                }
            }
        });
    }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Use system temp directory which should always be writable
        const tempDir = path.join(__dirname, '..', '..', 'temp');
        console.log('Using temporary directory for initial upload:', tempDir);
        
        // Ensure temp directory exists
        try {
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            cb(null, tempDir);
        } catch (err) {
            console.error('Error creating temp directory:', err);
            // Fallback to system temp directory
            cb(null, require('os').tmpdir());
        }
    },
    filename: function (req, file, cb) {
        // Simple filename with minimal special characters
        const uniqueName = `file_${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${file.originalname.split('.').pop()}`;
        cb(null, uniqueName);
    }
});

// File filter to restrict file types
const fileFilter = (req, file, cb) => {
    // Accept common document formats and images
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, and PNG files are allowed.'), false);
    }
};

// Configure upload middleware
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB file size limit
    }
});

// Start transaction methods 
const beginTransaction = async () => await db.beginTransaction();
const commit = async () => await db.commit();
const rollback = async () => await db.rollback();

// NEW ENDPOINT: Get application details by ID
router.get('/:applicationId', async (req, res) => {
    try {
        const { applicationId } = req.params;
        // In development mode, we'll skip authentication for testing
        const userId = req.user?.user_id || 1;

        console.log(`Getting application details for application ID ${applicationId}`);

        // First make sure the application exists
        const [appCheck] = await db.query(
            'SELECT application_id FROM applications WHERE application_id = ?',
            [applicationId]
        );

        if (appCheck.length === 0) {
            console.log(`Application ID ${applicationId} not found in database`);
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        // Get user role information if user is authenticated
        let isAdmin = false;
        let isIntern = false;
        let isEmployer = false;
        let internId = null;
        let companyId = null;
        
        if (req.user) {
            isAdmin = req.user.role === 'Admin';
            
            // Check if user is an intern
            try {
                const [interns] = await db.query(
                    'SELECT id as intern_id FROM interns_tbl WHERE user_id = ?',
                    [userId]
                );
                isIntern = interns.length > 0;
                if (isIntern) {
                    internId = interns[0].intern_id;
                }
            } catch (err) {
                console.error('Error checking intern status:', err);
            }

            // Check if user is an employer
            try {
                const [employers] = await db.query(
                    'SELECT id as employer_id, company_id FROM employers_tbl WHERE user_id = ?',
                    [userId]
                );
                isEmployer = employers.length > 0;
                if (isEmployer) {
                    companyId = employers[0].company_id;
                }
            } catch (err) {
                console.error('Error checking employer status:', err);
            }
        } else {
            console.log('Development mode: No user authentication required for application details');
        }

        // Get the application details with a more explicit query that includes all necessary job details
        try {
            const [applications] = await db.query(`
                SELECT 
                    a.application_id, a.listing_id, a.intern_id, a.status, 
                    a.cover_letter, a.file_info, a.additional_info, a.applied_at, a.updated_at,
                    j.job_title, j.description, j.requirements, j.location, j.is_paid, j.skills as job_skills,
                    j.status as job_status,
                    c.company_name, c.industry_sector, c.company_id, c.company_description,
                    i.first_name, i.last_name, i.skills, i.school, i.course,
                    u.email, u.mobile_number
                FROM 
                    applications a
                JOIN 
                    job_listings j ON a.listing_id = j.listing_id
                JOIN 
                    companies_tbl c ON j.company_id = c.company_id
                JOIN 
                    interns_tbl i ON a.intern_id = i.id
                JOIN 
                    users_tbl u ON i.user_id = u.user_id
                WHERE 
                    a.application_id = ?
            `, [applicationId]);

            if (applications.length === 0) {
                console.log(`Application ID ${applicationId} join query returned no results`);
                return res.status(404).json({
                    success: false,
                    message: 'Application details not found'
                });
            }

            const application = applications[0];

            // In development mode, skip authorization checks
            if (req.user) {
                // Check authorization - interns can only see their own applications
                if (isIntern && internId !== application.intern_id) {
                    return res.status(403).json({
                        success: false,
                        message: 'You are not authorized to view this application'
                    });
                }
                // Employers can only see applications for their companies
                if (isEmployer && companyId !== application.company_id) {
                    return res.status(403).json({
                        success: false,
                        message: 'You are not authorized to view this application'
                    });
                }
                // If not admin, intern or employer, deny access
                if (!isAdmin && !isIntern && !isEmployer) {
                    return res.status(403).json({
                        success: false,
                        message: 'Unauthorized access'
                    });
                }
            } else {
                console.log('Development mode: Skipping application authorization checks');
            }

            // Parse JSON fields with better error handling
            try {
                if (application.skills) {
                    try {
                        application.skills = JSON.parse(application.skills);
                    } catch (e) {
                        console.error('Error parsing skills JSON:', e);
                        application.skills = [];
                    }
                } else {
                    application.skills = [];
                }
                
                if (application.job_skills) {
                    try {
                        application.job_skills = JSON.parse(application.job_skills);
                    } catch (e) {
                        console.error('Error parsing job_skills JSON:', e);
                        application.job_skills = [];
                    }
                } else {
                    application.job_skills = [];
                }
                
                if (application.file_info) {
                    try {
                        application.file_info = JSON.parse(application.file_info);
                    } catch (e) {
                        console.error('Error parsing file_info JSON:', e);
                        application.file_info = {};
                    }
                } else {
                    application.file_info = {};
                }
                
                if (application.additional_info) {
                    try {
                        application.additional_info = JSON.parse(application.additional_info);
                    } catch (e) {
                        console.error('Error parsing additional_info JSON:', e);
                        application.additional_info = {};
                    }
                } else {
                    application.additional_info = {};
                }
            } catch (e) {
                console.error('Error handling JSON fields:', e);
                // Continue with default values if parsing fails
            }

            // Add some helpful metadata for the frontend
            application.status_info = {
                is_pending: application.status === 'Pending',
                is_reviewing: application.status === 'Reviewing',
                is_accepted: application.status === 'Accepted',
                is_rejected: application.status === 'Rejected',
                is_withdrawn: application.status === 'Withdrawn',
                last_updated: application.updated_at,
                status_display: application.status,
                action_required: isIntern && application.status === 'Accepted' ? 'Please contact the employer to confirm your start date.' : null,
                message: getStatusMessage(application.status)
            };

            // Return the application details
            console.log(`Successfully retrieved application details for ID ${applicationId}`);
            return res.json({
                success: true,
                application
            });
        } catch (queryError) {
            console.error('Error in application details query:', queryError);
            return res.status(500).json({
                success: false,
                message: 'Error fetching application details from database',
                error: queryError.message
            });
        }
    } catch (error) {
        console.error('Error fetching application details:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching application details',
            error: error.message
        });
    }
});

// Helper function to get status messages
function getStatusMessage(status) {
    switch (status) {
        case 'Pending':
            return 'Your application is currently pending review by the employer.';
        case 'Reviewing':
            return 'Your application is currently being reviewed by the employer.';
        case 'Accepted':
            return 'Congratulations! Your application has been accepted. Please check your email for further instructions.';
        case 'Rejected':
            return 'We regret to inform you that your application was not selected for this position.';
        case 'Withdrawn':
            return 'You have withdrawn this application.';
        default:
            return 'Application status unknown.';
    }
}

// Get all applications for a specific intern (student view)
router.get('/my-applications', authenticateToken, async (req, res) => {
    try {
        // Get intern_id from interns_tbl using user_id
        const [interns] = await db.query(
            'SELECT id as intern_id FROM interns_tbl WHERE user_id = ?',
            [req.user.user_id]
        );
        
        if (interns.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Intern profile not found'
            });
        }
        
        const internId = interns[0].intern_id;
        
        // Get all applications for this intern with job and company details
        const [applications] = await db.query(`
            SELECT a.*, j.job_title, j.location, j.is_paid, 
                   c.company_name, c.industry_sector
            FROM applications a
            JOIN job_listings j ON a.listing_id = j.listing_id
            JOIN companies_tbl c ON j.company_id = c.company_id
            WHERE a.intern_id = ?
            ORDER BY a.applied_at DESC
        `, [internId]);
        
        res.json({
            success: true,
            count: applications.length,
            applications
        });
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching applications',
            error: error.message
        });
    }
});

// Get all applications for a specific job listing (employer view)
router.get('/listing/:listingId', authenticateToken, authorizeRoles(['Employer', 'Admin']), async (req, res) => {
    try {
        const { listingId } = req.params;
        
        // Check if job listing exists
        const [listings] = await db.query(
            'SELECT * FROM job_listings jl WHERE jl.listing_id = ?',
            [listingId]
        );
        
        if (listings.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Job listing not found'
            });
        }
        
        const listing = listings[0];
        
        // For employers, check if they are affiliated with the company
        if (req.user.role === 'Employer') {
            const [employers] = await db.query(
                'SELECT * FROM employers_tbl WHERE user_id = ? AND company_id = ?',
                [req.user.user_id, listing.company_id]
            );
            
            if (employers.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not affiliated with this company'
                });
            }
        }
        
        // Get all applications for this listing with intern details
        const [applications] = await db.query(`
            SELECT a.*, 
                   i.first_name, i.last_name, i.skills, i.school, i.course,
                   u.email, u.mobile_number
            FROM applications a
            JOIN interns_tbl i ON a.intern_id = i.id
            JOIN users_tbl u ON i.user_id = u.user_id
            WHERE a.listing_id = ?
            ORDER BY a.applied_at DESC
        `, [listingId]);
        
        // Format response
        const formattedApplications = applications.map(app => {
            try {
                app.skills = JSON.parse(app.skills || '[]');
            } catch (e) {
                console.error('Error parsing skills:', e);
                app.skills = [];
            }
            return app;
        });
        
        res.json({
            success: true,
            count: formattedApplications.length,
            applications: formattedApplications
        });
    } catch (error) {
        console.error('Error fetching applications for listing:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching applications',
            error: error.message
        });
    }
});

// Apply for a job (intern only)
router.post('/:listingId', authenticateToken, upload.fields([
    { name: 'resume_file', maxCount: 1 },
    { name: 'supporting_docs', maxCount: 5 }
]), async (req, res) => {
    let connection;
    try {
        // Start transaction
        connection = await db.beginTransaction();
        
        // Extract token from req (ensure req.user exists from authenticateToken middleware)
        console.log("Application submission - authenticated user:", req.user);
        
        const { cover_letter, additional_info, force_reapplication } = req.body;
        const listingId = req.params.listingId;
        const userId = req.user.user_id;
        const resume_file = req.files['resume_file'] ? req.files['resume_file'][0] : null;
        const supporting_docs = req.files['supporting_docs'] || [];
        
        console.log('Received application data:', {
            listingId,
            userId,
            cover_letter: cover_letter ? 'PROVIDED' : 'MISSING',
            additionalInfo: additional_info ? 'PROVIDED' : 'MISSING',
            forceReapplication: force_reapplication === 'true',
            resumeFile: resume_file ? {
                originalname: resume_file.originalname,
                size: resume_file.size
            } : 'MISSING',
            supportingDocsCount: supporting_docs.length
        });
        
        // Safety check: make sure we have a resume file
        if (!resume_file) {
            await db.rollback(connection);
            cleanupTempFiles(req.files);
            return res.status(400).json({ 
                success: false, 
                message: "Resume file is required" 
            });
        }
        
        // Get intern_id from interns_tbl using user_id and also check verification status
        const [interns] = await db.query(
            'SELECT id as intern_id, verification_status FROM interns_tbl WHERE user_id = ?',
            [userId],
            connection
        );
        
        if (interns.length === 0) {
            await db.rollback(connection);
            cleanupTempFiles(req.files);
            return res.status(400).json({
                success: false,
                message: 'Intern profile not found. Please complete your profile before applying.'
            });
        }
        
        const internId = interns[0].intern_id;
        const verificationStatus = interns[0].verification_status;
        
        // Check if the intern is verified/accepted by admin
        if (verificationStatus === 'Rejected') {
            await db.rollback(connection);
            cleanupTempFiles(req.files);
            return res.status(403).json({
                success: false,
                message: 'Your account verification has been rejected. You cannot apply for internships. Please contact an administrator for assistance.',
                status: 'Rejected'
            });
        } else if (verificationStatus !== 'Accepted') {
            await db.rollback(connection);
            cleanupTempFiles(req.files);
            return res.status(403).json({
                success: false,
                message: 'Your account has not been approved by an administrator yet. Please wait for approval before applying for jobs.',
                status: verificationStatus
            });
        }
        
        // Check if the job listing is active
        const [listings] = await db.query(
            "SELECT * FROM job_listings WHERE listing_id = ? AND status = 'Active'",
            [listingId],
            connection
        );
        
        if (listings.length === 0) {
            await db.rollback(connection);
            cleanupTempFiles(req.files);
            return res.status(400).json({ 
                success: false,
                message: "Job listing not found or not active" 
            });
        }
        
        // Check if the user has already applied for this position
        const [existingApplications] = await db.query(
            "SELECT * FROM applications WHERE listing_id = ? AND intern_id = ?",
            [listingId, internId],
            connection
        );
        
        const forceReapplication = force_reapplication === 'true';
        
        // Handle existing applications based on status
        if (existingApplications.length > 0) {
            // If there's an existing application and force_reapplication is not set, return error
            const activeApplication = existingApplications.find(app => app.status !== 'Withdrawn');
            
            if (activeApplication && !forceReapplication) {
                await db.rollback(connection);
                cleanupTempFiles(req.files);
                return res.status(400).json({ 
                    success: false,
                    message: "You have already applied for this position",
                    applicationId: activeApplication.application_id
                });
            }
            
            // If force_reapplication is set or all applications are withdrawn, delete them
            console.log(`Found ${existingApplications.length} existing applications for listing ${listingId}. Deleting them before creating a new one.`);
            
            // Delete each existing application
            for (const app of existingApplications) {
                await db.query(
                    'DELETE FROM applications WHERE application_id = ?',
                    [app.application_id],
                    connection
                );
            }
            
            console.log(`Successfully deleted ${existingApplications.length} existing applications`);
        }
        
        // Process the uploaded files
        const fileInfo = {
            resume: {
                path: resume_file.path,
                originalname: resume_file.originalname,
                mimetype: resume_file.mimetype,
                size: resume_file.size
            },
            supporting_docs: supporting_docs.map(doc => ({
                path: doc.path,
                originalname: doc.originalname,
                mimetype: doc.mimetype,
                size: doc.size
            }))
        };
        
        // Prepare additional info JSON
        let additionalInfo = {};
        try {
            additionalInfo = additional_info ? JSON.parse(additional_info) : {};
        } catch (e) {
            console.warn("Error parsing additional_info:", e.message);
            // Continue with empty additionalInfo object
        }
        
        // Insert the application with proper file_info JSON
        const [result] = await db.query(
            `INSERT INTO applications 
             (listing_id, intern_id, cover_letter, file_info, additional_info, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                listingId,
                internId,
                cover_letter || '',
                JSON.stringify(fileInfo),
                JSON.stringify(additionalInfo),
                'Pending'
            ],
            connection
        );
        
        const applicationId = result.insertId;
        
        // Commit transaction
        await db.commit(connection);
        
        // Return success response
        res.status(201).json({
            success: true,
            message: "Application submitted successfully",
            applicationId: applicationId
        });
        
    } catch (error) {
        // Safely rollback transaction on error if connection exists
        if (connection) {
            try {
                await db.rollback(connection);
            } catch (rollbackError) {
                console.error("Error rolling back transaction:", rollbackError);
            }
        }
        
        // Always clean up temp files on error
        cleanupTempFiles(req.files);
        
        console.error("Error in application submission:", error);
        
        // Handle duplicate entry specifically
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: "You have already applied for this position. Please try again with force_reapplication=true"
            });
        }
        
        res.status(500).json({
            success: false,
            message: "Error submitting application",
            error: error.message
        });
    } finally {
        // Make sure temp files are always cleaned up, even if we forgot in the catches
        cleanupTempFiles(req.files);
    }
});

// Update application status (employer only)
router.patch('/:applicationId/status', authenticateToken, authorizeRoles(['Employer', 'Admin']), async (req, res) => {
    try {
        await db.beginTransaction();
        
        const { applicationId } = req.params;
        const { status } = req.body;
        
        if (!status || !['Pending', 'Reviewing', 'Accepted', 'Rejected', 'Withdrawn'].includes(status)) {
            await db.rollback();
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }
        
        // Get application and check if it exists
        const [applications] = await db.query(`
            SELECT a.*, j.company_id 
            FROM applications a
            JOIN job_listings j ON a.listing_id = j.listing_id
            WHERE a.application_id = ?
        `, [applicationId]);
        
        if (applications.length === 0) {
            await db.rollback();
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }
        
        const application = applications[0];
        
        // For employers, check if they are affiliated with the company
        if (req.user.role === 'Employer') {
            const [employers] = await db.query(
                'SELECT * FROM employers_tbl WHERE user_id = ? AND company_id = ?',
                [req.user.user_id, application.company_id]
            );
            
            if (employers.length === 0) {
                await db.rollback();
                return res.status(403).json({
                    success: false,
                    message: 'You are not authorized to update this application'
                });
            }
        }
        
        // Update application status
        await db.query(
            'UPDATE applications SET status = ?, updated_at = NOW() WHERE application_id = ?',
            [status, applicationId]
        );
        
        // Commit transaction
        await db.commit();
        
        res.json({
            success: true,
            message: `Application status updated to ${status}`
        });
    } catch (error) {
        // Rollback transaction on error
        await db.rollback();
        console.error('Error updating application status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating application status',
            error: error.message
        });
    }
});

// Withdraw application (intern only) - POST method to avoid CORS issues
router.post('/:applicationId/withdraw', authenticateToken, async (req, res) => {
    let connection;
    try {
        // Start transaction
        connection = await db.beginTransaction();
        
        const { applicationId } = req.params;
        
        // Get intern_id from interns_tbl using user_id
        const [interns] = await db.query(
            'SELECT id as intern_id FROM interns_tbl WHERE user_id = ?',
            [req.user.user_id]
        );
        
        if (interns.length === 0) {
            await db.rollback(connection);
            return res.status(404).json({
                success: false,
                message: 'Intern profile not found'
            });
        }
        
        const internId = interns[0].intern_id;
        
        // Get application and check if it belongs to this intern
        const [applications] = await db.query(
            'SELECT * FROM applications WHERE application_id = ? AND intern_id = ?',
            [applicationId, internId]
        );
        
        if (applications.length === 0) {
            await db.rollback(connection);
            return res.status(404).json({
                success: false,
                message: 'Application not found or does not belong to you'
            });
        }
        
        // Update application status to Withdrawn
        await db.query(
            'UPDATE applications SET status = "Withdrawn", updated_at = NOW() WHERE application_id = ?',
            [applicationId]
        );
        
        // Commit transaction
        await db.commit(connection);
        
        res.json({
            success: true,
            message: 'Application withdrawn successfully'
        });
    } catch (error) {
        // Safely rollback transaction on error if connection exists
        if (connection) {
            await db.rollback(connection);
        }
        console.error('Error withdrawing application:', error);
        res.status(500).json({
            success: false,
            message: 'Error withdrawing application',
            error: error.message
        });
    }
});

// Also add a route for simple application status updates with POST
router.post('/:applicationId', authenticateToken, async (req, res) => {
    try {
        await db.beginTransaction();
        
        const { applicationId } = req.params;
        const { status } = req.body;
        
        if (!status) {
            await db.rollback();
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }
        
        // Get intern_id from interns_tbl using user_id
        const [interns] = await db.query(
            'SELECT id as intern_id FROM interns_tbl WHERE user_id = ?',
            [req.user.user_id]
        );
        
        if (interns.length === 0) {
            await db.rollback();
            return res.status(404).json({
                success: false,
                message: 'Intern profile not found'
            });
        }
        
        const internId = interns[0].intern_id;
        
        // Get application and check if it belongs to this intern
        const [applications] = await db.query(
            'SELECT * FROM applications WHERE application_id = ? AND intern_id = ?',
            [applicationId, internId]
        );
        
        if (applications.length === 0) {
            await db.rollback();
            return res.status(404).json({
                success: false,
                message: 'Application not found or does not belong to you'
            });
        }
        
        // Update application status
        await db.query(
            'UPDATE applications SET status = ?, updated_at = NOW() WHERE application_id = ?',
            [status, applicationId]
        );
        
        // Commit transaction
        await db.commit();
        
        res.json({
            success: true,
            message: `Application status updated to ${status}`
        });
    } catch (error) {
        // Rollback transaction on error
        await db.rollback();
        console.error('Error updating application status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating application status',
            error: error.message
        });
    }
});

// Delete a specific application (usually for withdrawn applications)
router.delete('/:applicationId', authenticateToken, async (req, res) => {
    let connection;
    try {
        connection = await db.beginTransaction();
        
        const { applicationId } = req.params;
        
        // Get intern_id from interns_tbl using user_id for authorization
        const [interns] = await db.query(
            'SELECT id as intern_id FROM interns_tbl WHERE user_id = ?',
            [req.user.user_id]
        );
        
        if (interns.length === 0) {
            await db.rollback(connection);
            return res.status(404).json({
                success: false,
                message: 'Intern profile not found'
            });
        }
        
        const internId = interns[0].intern_id;
        
        // Get application and check if it belongs to this intern
        const [applications] = await db.query(
            'SELECT * FROM applications WHERE application_id = ?',
            [applicationId]
        );
        
        if (applications.length === 0) {
            await db.rollback(connection);
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }
        
        const application = applications[0];
        
        // Security check - only allow interns to delete their own applications
        // or admins to delete any application
        if (req.user.role !== 'Admin' && application.intern_id !== internId) {
            await db.rollback(connection);
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete this application'
            });
        }
        
        // Delete the application
        await db.query(
            'DELETE FROM applications WHERE application_id = ?',
            [applicationId]
        );
        
        // Commit transaction
        await db.commit(connection);
        
        res.json({
            success: true,
            message: 'Application deleted successfully'
        });
    } catch (error) {
        // Safely rollback transaction on error if connection exists
        if (connection) {
            await db.rollback(connection);
        }
        console.error('Error deleting application:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting application',
            error: error.message
        });
    }
});

// Cleanup endpoint for applications
router.post('/cleanup/:listingId', authenticateToken, async (req, res) => {
    try {
        const { listingId } = req.params;
        const userId = req.user.user_id;
        const force = req.body.force === 'true';
        
        console.log(`Cleanup request for listing ${listingId} by user ${userId} (force=${force})`);
        
        // Get intern_id from interns_tbl using user_id
        const [interns] = await db.query(
            'SELECT id as intern_id FROM interns_tbl WHERE user_id = ?',
            [userId]
        );
        
        if (interns.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Intern profile not found.'
            });
        }
        
        const internId = interns[0].intern_id;
        
        // Delete applications for this listing by this intern
        const [result] = await db.query(
            'DELETE FROM applications WHERE listing_id = ? AND intern_id = ?',
            [listingId, internId]
        );
        
        res.json({
            success: true,
            message: `Cleaned up ${result.affectedRows} application records`,
            cleaned: result.affectedRows
        });
    } catch (error) {
        console.error('Error in cleanup endpoint:', error);
        res.status(500).json({
            success: false,
            message: 'Error cleaning up applications',
            error: error.message
        });
    }
});

// Get whether the user can apply for a job (intern only)
router.get('/:listingId/can-apply', authenticateToken, async (req, res) => {
    try {
        const listingId = req.params.listingId;
        const userId = req.user.user_id;
        
        // Check if the user is an intern with a complete profile
        const [interns] = await db.query(
            'SELECT id as intern_id, verification_status FROM interns_tbl WHERE user_id = ?',
            [userId]
        );
        
        if (interns.length === 0) {
            return res.status(200).json({
                canApply: false,
                reason: 'intern_not_found',
                message: 'Intern profile not found. Please complete your profile before applying.'
            });
        }
        
        const internId = interns[0].intern_id;
        const verificationStatus = interns[0].verification_status;
        
        // Check if the intern is verified/approved
        if (verificationStatus === 'Rejected') {
            return res.status(200).json({
                canApply: false,
                reason: 'rejected',
                message: 'Your account verification has been rejected. You cannot apply for internships. Please contact an administrator for assistance.',
                status: 'Rejected'
            });
        } else if (verificationStatus !== 'Accepted') {
            return res.status(200).json({
                canApply: false,
                reason: 'not_approved',
                message: 'Your account has not been approved by an administrator yet. Please wait for approval before applying for jobs.',
                status: verificationStatus
            });
        }
        
        // Check if the job listing exists and is active
        const [listings] = await db.query(
            'SELECT * FROM job_listings WHERE listing_id = ? AND status = "Active"',
            [listingId]
        );
        
        if (listings.length === 0) {
            return res.status(200).json({
                canApply: false,
                reason: 'job_not_found',
                message: 'Job listing not found or not active'
            });
        }
        
        // Check for active applications
        const [activeApplications] = await db.query(
            'SELECT * FROM applications WHERE listing_id = ? AND intern_id = ? AND status != "Withdrawn"',
            [listingId, internId]
        );
        
        // Check for withdrawn applications
        const [withdrawnApplications] = await db.query(
            'SELECT application_id FROM applications WHERE listing_id = ? AND intern_id = ? AND status = "Withdrawn"',
            [listingId, internId]
        );
        
        if (activeApplications.length > 0) {
            // If there are active applications, user cannot apply
            return res.status(200).json({
                canApply: false,
                reason: 'already_applied',
                message: 'You have already applied for this position',
                activeApplications: activeApplications.map(app => ({ 
                    id: app.application_id,
                    status: app.status 
                }))
            });
        }
        
        // Check if there are withdrawn applications
        const hasWithdrawnApplications = withdrawnApplications.length > 0;
        
        // All checks passed - determine response based on withdrawn status
        if (hasWithdrawnApplications) {
            // User can apply, but previously withdrew an application
            return res.status(200).json({
                canApply: true,
                previouslyWithdrawn: true,
                withdrawnApplicationIds: withdrawnApplications.map(app => app.application_id),
                message: 'You previously withdrew an application for this position, but can apply again'
            });
        } else {
            // User can apply normally - no previous history
            return res.status(200).json({
                canApply: true,
                previouslyWithdrawn: false,
                message: 'You can apply for this position'
            });
        }
    } catch (error) {
        console.error('Error checking if user can apply:', error);
        res.status(500).json({
            canApply: false,
            reason: 'server_error',
            message: 'Error checking application status',
            error: error.message
        });
    }
});

// Cancel application (intern only) - Simple approach that just deletes the application
router.post('/:applicationId/cancel', authenticateToken, async (req, res) => {
    let connection;
    try {
        // Start transaction
        connection = await db.beginTransaction();
        
        const { applicationId } = req.params;
        
        // Get intern_id from interns_tbl using user_id
        const [interns] = await db.query(
            'SELECT id as intern_id FROM interns_tbl WHERE user_id = ?',
            [req.user.user_id]
        );
        
        if (interns.length === 0) {
            await db.rollback(connection);
            return res.status(404).json({
                success: false,
                message: 'Intern profile not found'
            });
        }
        
        const internId = interns[0].intern_id;
        
        // Get application and check if it belongs to this intern
        const [applications] = await db.query(
            'SELECT * FROM applications WHERE application_id = ? AND intern_id = ?',
            [applicationId, internId]
        );
        
        if (applications.length === 0) {
            await db.rollback(connection);
            return res.status(404).json({
                success: false,
                message: 'Application not found or does not belong to you'
            });
        }
        
        // Delete the application directly
        await db.query(
            'DELETE FROM applications WHERE application_id = ?',
            [applicationId]
        );
        
        // Commit transaction
        await db.commit(connection);
        
        res.json({
            success: true,
            message: 'Application canceled successfully'
        });
    } catch (error) {
        // Safely rollback transaction on error if connection exists
        if (connection) {
            await db.rollback(connection);
        }
        console.error('Error canceling application:', error);
        res.status(500).json({
            success: false,
            message: 'Error canceling application',
            error: error.message
        });
    }
});

// Get all applications for the employer's company
router.get('/employer', authenticateToken, authorizeRoles(['Employer']), async (req, res) => {
    try {
        console.log('Fetching employer applications for user:', req.user.user_id);
        
        // Get company_id from employer information
        const [employer] = await db.query(
            'SELECT company_id FROM employers_tbl WHERE user_id = ?',
            [req.user.user_id]
        );
        
        if (employer.length === 0 || !employer[0].company_id) {
            console.log('No company associated with this employer:', req.user.user_id);
            return res.status(400).json({
                success: false,
                message: 'No company associated with this employer'
            });
        }
        
        const company_id = employer[0].company_id;
        console.log('Found company_id:', company_id);
        
        // Get all applications for job listings of this company
        const [applications] = await db.query(`
            SELECT a.*, j.job_title, j.location, j.is_paid,
                   c.company_name, c.industry_sector,
                   u.first_name, u.last_name, u.email
            FROM applications a
            JOIN job_listings j ON a.listing_id = j.listing_id
            JOIN companies_tbl c ON j.company_id = c.company_id
            JOIN interns_tbl i ON a.intern_id = i.id
            JOIN users_tbl u ON i.user_id = u.user_id
            WHERE j.company_id = ?
            ORDER BY a.applied_at DESC
        `, [company_id]);
        
        console.log(`Found ${applications.length} applications for company ${company_id}`);
        
        // Process applications to include student information
        const processedApplications = applications.map(app => ({
            application_id: app.application_id,
            listing_id: app.listing_id,
            intern_id: app.intern_id,
            status: app.status,
            applied_at: app.applied_at,
            updated_at: app.updated_at,
            cover_letter: app.cover_letter,
            file_info: typeof app.file_info === 'string' ? JSON.parse(app.file_info) : app.file_info,
            additional_info: typeof app.additional_info === 'string' ? JSON.parse(app.additional_info) : app.additional_info,
            job_title: app.job_title,
            location: app.location,
            is_paid: app.is_paid,
            company_name: app.company_name,
            industry_sector: app.industry_sector,
            student: {
                first_name: app.first_name,
                last_name: app.last_name,
                email: app.email
            }
        }));
        
        res.json({
            success: true,
            count: processedApplications.length,
            applications: processedApplications
        });
    } catch (error) {
        console.error('Error fetching employer applications:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching employer applications',
            error: error.message
        });
    }
});

// Express error handler for this router
router.use((err, req, res, next) => {
    console.error('Application routes error:', err);
    res.status(500).json({
        success: false,
        message: 'Server error in application handling',
        error: err.message || 'Unknown error'
    });
});

module.exports = router; 