/**
 * Job Routes
 * Handles job listing CRUD operations
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { ValidationError, NotFoundError } = require('../middleware/error-handler');

/**
 * @route GET /api/jobs
 * @desc Get all job listings
 * @access Public
 */
router.get('/', async (req, res, next) => {
    try {
        // Get query parameters for filtering
        const { 
            status = 'Active',
            search = '',
            location = '',
            company_id = null,
            limit = 20,
            offset = 0 
        } = req.query;

        // Build WHERE clause for filtering
        let whereClause = 'WHERE j.is_deleted = FALSE ';
        const params = [];

        if (status && status !== 'All') {
            whereClause += 'AND j.status = ? ';
            params.push(status);
        }

        if (search) {
            whereClause += 'AND (j.title LIKE ? OR j.description LIKE ? OR j.skills_required LIKE ?) ';
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam);
        }

        if (location) {
            whereClause += 'AND j.location LIKE ? ';
            params.push(`%${location}%`);
        }

        if (company_id) {
            whereClause += 'AND j.company_id = ? ';
            params.push(company_id);
        }

        // Add pagination parameters
        params.push(parseInt(limit), parseInt(offset));

        // First check if companies_tbl exists
        const [tablesResult] = await db.query(
            "SELECT COUNT(*) as table_exists FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'companies_tbl'"
        );
        
        const companiesTableExists = tablesResult[0].table_exists > 0;
        
        let query;
        if (companiesTableExists) {
            // If companies table exists, use the join
            query = `
                SELECT j.*, c.name as company_name, c.logo_url as company_logo
                FROM job_listings_tbl j
                LEFT JOIN companies_tbl c ON j.company_id = c.id
                ${whereClause}
                ORDER BY j.created_at DESC
                LIMIT ? OFFSET ?
            `;
        } else {
            // Otherwise just get the job data without the join
            query = `
                SELECT j.* 
                FROM job_listings_tbl j
                ${whereClause}
                ORDER BY j.created_at DESC
                LIMIT ? OFFSET ?
            `;
        }

        // Query to get total count for pagination
        const countQuery = `
            SELECT COUNT(*) as total
            FROM job_listings_tbl j
            ${whereClause}
        `;

        // Execute queries
        const [jobs] = await db.query(query, params);
        const [countResult] = await db.query(countQuery, params.slice(0, -2));
        const total = countResult[0].total;

        // Return response
        res.status(200).json({
            success: true,
            jobs,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching jobs:', error);
        // Provide fallback with empty jobs array
        res.status(200).json({
            success: true,
            message: 'Error fetching jobs, showing empty list',
            jobs: [],
            pagination: {
                total: 0,
                limit: parseInt(req.query.limit || 20),
                offset: parseInt(req.query.offset || 0),
                pages: 0
            }
        });
    }
});

/**
 * @route GET /api/jobs/:id
 * @desc Get a single job listing
 * @access Public
 */
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        // First check if companies_tbl exists
        const [tablesResult] = await db.query(
            "SELECT COUNT(*) as table_exists FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'companies_tbl'"
        );
        
        const companiesTableExists = tablesResult[0].table_exists > 0;
        
        let query;
        if (companiesTableExists) {
            // If companies table exists, use the join
            query = `
                SELECT j.*, c.name as company_name, c.logo_url as company_logo,
                       c.description as company_description, c.website as company_website,
                       c.location as company_location
                FROM job_listings_tbl j
                LEFT JOIN companies_tbl c ON j.company_id = c.id
                WHERE j.id = ? AND j.is_deleted = FALSE
            `;
        } else {
            // Otherwise just get the job data without the join
            query = `
                SELECT j.* 
                FROM job_listings_tbl j
                WHERE j.id = ? AND j.is_deleted = FALSE
            `;
        }

        const [jobs] = await db.query(query, [id]);

        if (jobs.length === 0) {
            throw new NotFoundError(`Job listing with ID ${id} not found`);
        }

        res.status(200).json({
            success: true,
            job: jobs[0]
        });
    } catch (error) {
        console.error('Error fetching job details:', error);
        next(error);
    }
});

/**
 * @route POST /api/jobs
 * @desc Create a new job listing
 * @access Private/Employer
 */
router.post('/', async (req, res, next) => {
    try {
        // Validate required fields
        const { 
            title, 
            company_id, 
            description, 
            requirements,
            location, 
            is_paid, 
            status = 'Active'
        } = req.body;

        if (!title || !company_id || !description) {
            throw new ValidationError('Title, company ID, and description are required');
        }

        // Create job listing
        const [result] = await db.query(
            `INSERT INTO job_listings_tbl (
                title, company_id, description, requirements, location, 
                is_paid, status, created_by, salary, job_type, 
                positions_available, application_deadline, start_date, 
                duration, skills_required, qualification
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                title, 
                company_id, 
                description, 
                requirements || null, 
                location || null,
                is_paid !== undefined ? is_paid : true, 
                status, 
                req.user?.id || null,
                req.body.salary || null,
                req.body.job_type || 'On-site',
                req.body.positions_available || 1,
                req.body.application_deadline || null,
                req.body.start_date || null,
                req.body.duration || null,
                req.body.skills_required || null,
                req.body.qualification || null
            ]
        );

        // Get the newly created job
        const [jobs] = await db.query(
            'SELECT * FROM job_listings_tbl WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            job: jobs[0],
            message: 'Job listing created successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route PUT /api/jobs/:id
 * @desc Update a job listing
 * @access Private/Employer
 */
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Check if job exists and belongs to the employer
        const [jobs] = await db.query(
            'SELECT * FROM job_listings_tbl WHERE id = ? AND is_deleted = FALSE',
            [id]
        );

        if (jobs.length === 0) {
            throw new NotFoundError(`Job listing with ID ${id} not found`);
        }

        // Only allow update if user is the owner or admin
        // In a real app, you'd check ownership: jobs[0].company_id === req.user.company_id
        
        // Update fields that were provided
        const updateFields = [];
        const updateValues = [];

        const allowedFields = [
            'title', 'description', 'requirements', 'location', 'is_paid',
            'status', 'job_type', 'positions_available', 'application_deadline',
            'start_date', 'duration', 'skills_required', 'qualification',
            'is_active', 'salary'
        ];

        for (const [key, value] of Object.entries(req.body)) {
            if (allowedFields.includes(key) && value !== undefined) {
                updateFields.push(`${key} = ?`);
                updateValues.push(value);
            }
        }

        if (updateFields.length === 0) {
            throw new ValidationError('No valid fields to update');
        }

        // Add the ID as the last parameter
        updateValues.push(id);

        // Perform the update
        await db.query(
            `UPDATE job_listings_tbl SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
            updateValues
        );

        // Get the updated job
        const [updatedJobs] = await db.query(
            'SELECT * FROM job_listings_tbl WHERE id = ?',
            [id]
        );

        res.status(200).json({
            success: true,
            job: updatedJobs[0],
            message: 'Job listing updated successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route DELETE /api/jobs/:id
 * @desc Soft delete a job listing
 * @access Private/Employer
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if job exists
        const [jobs] = await db.query(
            'SELECT * FROM job_listings_tbl WHERE id = ? AND is_deleted = FALSE',
            [id]
        );

        if (jobs.length === 0) {
            throw new NotFoundError(`Job listing with ID ${id} not found`);
        }

        // Only allow deletion if user is the owner or admin
        // In a real app, you'd check ownership: jobs[0].company_id === req.user.company_id

        // Soft delete the job
        await db.query(
            'UPDATE job_listings_tbl SET is_deleted = TRUE, updated_at = NOW() WHERE id = ?',
            [id]
        );

        res.status(200).json({
            success: true,
            message: 'Job listing deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/jobs/employer
 * @desc Get job listings for a specific employer
 * @access Private/Employer
 */
router.get('/employer', async (req, res, next) => {
    try {
        // In a real app, you'd get the company_id from the authenticated user
        // const company_id = req.user.company_id;
        const company_id = req.query.company_id || req.user?.company_id;

        if (!company_id) {
            // If no specific company_id, return mock data for demo purposes
            return res.status(200).json({
                success: true,
                message: 'Demo mode: Using mock data',
                jobs: getMockJobs()
            });
        }

        // First check if companies_tbl exists
        const [tablesResult] = await db.query(
            "SELECT COUNT(*) as table_exists FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'companies_tbl'"
        );
        
        const companiesTableExists = tablesResult[0].table_exists > 0;
        
        let query;
        if (companiesTableExists) {
            // If companies table exists, use the join
            query = `
                SELECT j.*, c.name as company_name, c.logo_url as company_logo 
                FROM job_listings_tbl j
                LEFT JOIN companies_tbl c ON j.company_id = c.id
                WHERE j.company_id = ? AND j.is_deleted = FALSE 
                ORDER BY j.created_at DESC
            `;
        } else {
            // Otherwise just get the job data without the join
            query = `
                SELECT j.* FROM job_listings_tbl j
                WHERE j.company_id = ? AND j.is_deleted = FALSE 
                ORDER BY j.created_at DESC
            `;
        }

        const [jobs] = await db.query(query, [company_id]);

        res.status(200).json({
            success: true,
            jobs
        });
    } catch (error) {
        console.error('Error fetching employer jobs:', error);
        
        // Provide mock data as fallback
        res.status(200).json({
            success: true,
            message: 'Error fetching jobs, using mock data instead',
            jobs: getMockJobs()
        });
    }
});

/**
 * @route GET /api/jobs/employer/my-listings
 * @desc Get job listings for the current employer with pagination
 * @access Private/Employer
 */
router.get('/employer/my-listings', async (req, res, next) => {
    try {
        // Get query parameters for pagination and filtering
        const { 
            status = 'All',
            limit = 5,
            offset = 0 
        } = req.query;

        // In a real app, get company_id from the authenticated user
        const company_id = req.user?.company_id;

        if (!company_id) {
            return res.status(200).json({
                success: true,
                message: 'Demo mode: Using mock data',
                jobs: getMockJobs(),
                pagination: {
                    total: getMockJobs().length,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    pages: Math.ceil(getMockJobs().length / limit)
                }
            });
        }

        // Build WHERE clause for filtering
        let whereClause = 'WHERE j.company_id = ? AND j.is_deleted = FALSE ';
        const params = [company_id];

        if (status && status !== 'All') {
            whereClause += 'AND j.status = ? ';
            params.push(status);
        }

        // Add pagination parameters
        params.push(parseInt(limit), parseInt(offset));

        // Query to get jobs
        const query = `
            SELECT * 
            FROM job_listings_tbl j
            ${whereClause}
            ORDER BY j.created_at DESC
            LIMIT ? OFFSET ?
        `;

        // Query to get total count for pagination
        const countQuery = `
            SELECT COUNT(*) as total
            FROM job_listings_tbl j
            ${whereClause}
        `;

        // Execute queries
        const [jobs] = await db.query(query, params);
        const [countResult] = await db.query(countQuery, params.slice(0, -2));
        const total = countResult[0].total;

        // Return response
        res.status(200).json({
            success: true,
            jobs,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching employer job listings:', error);
        // Provide fallback with mock data
        res.status(200).json({
            success: true,
            message: 'Error fetching jobs, using mock data',
            jobs: getMockJobs(),
            pagination: {
                total: getMockJobs().length,
                limit: parseInt(req.query.limit || 5),
                offset: parseInt(req.query.offset || 0),
                pages: Math.ceil(getMockJobs().length / (parseInt(req.query.limit) || 5))
            }
        });
    }
});

/**
 * Mock jobs for development/demo mode
 */
function getMockJobs() {
    return [
        {
            id: 1,
            title: 'Frontend Developer Intern',
            company_id: 1,
            company_name: 'Tech Solutions Inc.',
            description: 'We are looking for a passionate frontend developer intern to join our team.',
            requirements: 'HTML, CSS, JavaScript, React',
            location: 'Manila, Philippines',
            salary: '₱15,000 - ₱20,000',
            is_paid: true,
            is_active: true,
            status: 'Active',
            job_type: 'On-site',
            positions_available: 2,
            application_deadline: '2023-12-31',
            start_date: '2024-01-15',
            duration: '6 months',
            created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
        },
        {
            id: 2,
            title: 'Backend Developer Intern',
            company_id: 1,
            company_name: 'Tech Solutions Inc.',
            description: 'Join our backend team and work on exciting server-side projects.',
            requirements: 'Node.js, Express, SQL, MongoDB',
            location: 'Quezon City, Philippines',
            salary: '₱18,000 - ₱22,000',
            is_paid: true,
            is_active: true,
            status: 'Active',
            job_type: 'Hybrid',
            positions_available: 1,
            application_deadline: '2023-12-31',
            start_date: '2024-01-15',
            duration: '6 months',
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        {
            id: 3,
            title: 'UI/UX Design Intern',
            company_id: 1,
            company_name: 'Tech Solutions Inc.',
            description: 'Help us create beautiful and intuitive user interfaces.',
            requirements: 'Figma, Adobe XD, UI/UX principles',
            location: 'Remote',
            salary: '₱15,000 - ₱18,000',
            is_paid: true,
            is_active: true,
            status: 'Active',
            job_type: 'Remote',
            positions_available: 2,
            application_deadline: '2023-12-15',
            start_date: '2024-01-05',
            duration: '3 months',
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        }
    ];
}

module.exports = router; 