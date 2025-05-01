const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * @route GET /api/jobs
 * @desc Get all job listings with optional filtering and pagination
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    // Get filtering parameters from query string
    const { search, location, isPaid, page = 1, limit = 9 } = req.query;
    
    // Convert page and limit to integers
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    
    // Calculate offset
    const offset = (pageInt - 1) * limitInt;
    
    // Base query to get total count without pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM job_listings j
      JOIN companies_tbl c ON j.company_id = c.company_id
      WHERE j.status = 'Active'
    `;
    
    let query = `
      SELECT j.*, c.company_name, c.industry_sector 
      FROM job_listings j
      JOIN companies_tbl c ON j.company_id = c.company_id
      WHERE j.status = 'Active'
    `;
    
    const params = [];
    const countParams = [];
    
    // Add search filter if provided
    if (search) {
      const searchCondition = ` AND (j.job_title LIKE ? OR j.description LIKE ? OR c.company_name LIKE ?)`;
      query += searchCondition;
      countQuery += searchCondition;
      
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern, searchPattern);
    }
    
    // Add location filter if provided
    if (location) {
      const locationCondition = ` AND j.location LIKE ?`;
      query += locationCondition;
      countQuery += locationCondition;
      
      params.push(`%${location}%`);
      countParams.push(`%${location}%`);
    }
    
    // Add paid/unpaid filter if provided
    if (isPaid !== undefined) {
      const paidCondition = ` AND j.is_paid = ?`;
      query += paidCondition;
      countQuery += paidCondition;
      
      params.push(isPaid === 'true' || isPaid === true ? 1 : 0);
      countParams.push(isPaid === 'true' || isPaid === true ? 1 : 0);
    }
    
    // Add ordering
    query += ` ORDER BY j.created_at DESC`;
    
    // Add pagination
    query += ` LIMIT ? OFFSET ?`;
    params.push(limitInt, offset);
    
    // Execute both queries
    const [rows] = await db.query(query, params);
    const [countResult] = await db.query(countQuery, countParams);
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limitInt);
    
    res.status(200).json({
      success: true,
      count: rows.length,
      totalCount: total,
      page: pageInt,
      totalPages: totalPages,
      hasNextPage: pageInt < totalPages,
      hasPrevPage: pageInt > 1,
      listings: rows
    });
  } catch (error) {
    console.error('Error fetching job listings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching job listings'
    });
  }
});

/**
 * @route GET /api/jobs/:id
 * @desc Get a single job listing
 * @access Public
 */
router.get('/:id', async (req, res) => {
  try {
    const query = `
      SELECT j.*, c.company_name, c.industry_sector, c.company_description
      FROM job_listings j
      JOIN companies_tbl c ON j.company_id = c.company_id
      WHERE j.listing_id = ? AND j.status = 'Active'
    `;
    
    const [rows] = await db.query(query, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job listing not found'
      });
    }
    
    res.status(200).json({
      success: true,
      listing: rows[0]
    });
  } catch (error) {
    console.error('Error fetching job listing:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching job listing'
    });
  }
});

/**
 * @route POST /api/jobs
 * @desc Create a new job listing
 * @access Private (Employers only)
 */
router.post('/', authenticateToken, authorizeRoles(['Employer', 'Admin']), async (req, res) => {
  const { 
    job_title, 
    description, 
    requirements, 
    location,
    skills,
    is_paid,
    deadline,
    positions
  } = req.body;

  // Validate required fields
  if (!job_title || !description || !location) {
    return res.status(400).json({
      success: false,
      message: 'Please provide title, description, and location'
    });
  }

  try {
    // Get company_id from employer information
    const [employer] = await db.query(
      'SELECT company_id FROM employers_tbl WHERE user_id = ?',
      [req.user.user_id]
    );
    
    if (employer.length === 0 || !employer[0].company_id) {
      return res.status(400).json({
        success: false,
        message: 'No company associated with this employer'
      });
    }
    
    const company_id = employer[0].company_id;
    
    // Convert skills to JSON string if provided
    const skillsJson = skills ? JSON.stringify(Array.isArray(skills) ? skills : [skills]) : '[]';
    
    const query = `
      INSERT INTO job_listings (
        company_id, 
        job_title, 
        description, 
        requirements,
        location,
        skills,
        is_paid,
        deadline,
        positions,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
    `;
    
    const [result] = await db.query(query, [
      company_id,
      job_title,
      description,
      requirements,
      location,
      skillsJson,
      is_paid ? 1 : 0,
      deadline || null,
      positions || 1
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Job listing created successfully',
      listing_id: result.insertId
    });
  } catch (error) {
    console.error('Error creating job listing:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating job listing'
    });
  }
});

/**
 * @route PUT /api/jobs/:id
 * @desc Update a job listing
 * @access Private (Employers only)
 */
router.put('/:id', authenticateToken, authorizeRoles(['Employer', 'Admin']), async (req, res) => {
  const jobId = req.params.id;
  const { 
    job_title, 
    description, 
    requirements, 
    location,
    skills,
    is_paid,
    status,
    deadline,
    positions
  } = req.body;

  try {
    // First check if the job listing exists and belongs to the employer's company
    let query = `
      SELECT j.* FROM job_listings j
      WHERE j.listing_id = ?
    `;
    
    let params = [jobId];
    
    // If role is employer, add company check
    if (req.user.role === 'Employer') {
      query += ' AND j.company_id = (SELECT company_id FROM employers_tbl WHERE user_id = ?)';
      params.push(req.user.user_id);
    }
    
    const [jobListing] = await db.query(query, params);
    
    if (jobListing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job listing not found or you do not have permission to update it'
      });
    }
    
    // Build update parts
    const updates = [];
    const updateParams = [];
    
    if (job_title) {
      updates.push('job_title = ?');
      updateParams.push(job_title);
    }
    
    if (description) {
      updates.push('description = ?');
      updateParams.push(description);
    }
    
    if (requirements) {
      updates.push('requirements = ?');
      updateParams.push(requirements);
    }
    
    if (location) {
      updates.push('location = ?');
      updateParams.push(location);
    }
    
    if (skills) {
      updates.push('skills = ?');
      updateParams.push(JSON.stringify(Array.isArray(skills) ? skills : [skills]));
    }
    
    if (is_paid !== undefined) {
      updates.push('is_paid = ?');
      updateParams.push(is_paid ? 1 : 0);
    }
    
    if (deadline) {
      updates.push('deadline = ?');
      updateParams.push(deadline);
    }
    
    if (positions) {
      updates.push('positions = ?');
      updateParams.push(positions);
    }
    
    if (status && ['Active', 'Filled', 'Closed'].includes(status)) {
      updates.push('status = ?');
      updateParams.push(status);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    // Add listing_id at the end
    updateParams.push(jobId);
    
    // Update the job listing
    const updateQuery = `
      UPDATE job_listings
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE listing_id = ?
    `;
    
    await db.query(updateQuery, updateParams);
    
    res.status(200).json({
      success: true,
      message: 'Job listing updated successfully'
    });
  } catch (error) {
    console.error('Error updating job listing:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating job listing'
    });
  }
});

/**
 * @route DELETE /api/jobs/:id
 * @desc Delete a job listing (or change status to Closed)
 * @access Private (Employers only)
 */
router.delete('/:id', authenticateToken, authorizeRoles(['Employer', 'Admin']), async (req, res) => {
  const jobId = req.params.id;

  try {
    // First check if the job listing exists and belongs to the employer's company
    let query = `
      SELECT j.* FROM job_listings j
      WHERE j.listing_id = ?
    `;
    
    let params = [jobId];
    
    // If role is employer, add company check
    if (req.user.role === 'Employer') {
      query += ' AND j.company_id = (SELECT company_id FROM employers_tbl WHERE user_id = ?)';
      params.push(req.user.user_id);
    }
    
    const [jobListing] = await db.query(query, params);
    
    if (jobListing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job listing not found or you do not have permission to delete it'
      });
    }
    
    // Update status to 'Closed' instead of actually deleting
    await db.query(
      'UPDATE job_listings SET status = "Closed", updated_at = NOW() WHERE listing_id = ?',
      [jobId]
    );
    
    res.status(200).json({
      success: true,
      message: 'Job listing closed successfully'
    });
  } catch (error) {
    console.error('Error closing job listing:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while closing job listing'
    });
  }
});

/**
 * @route GET /api/jobs/company/:id
 * @desc Get all job listings for a specific company
 * @access Public
 */
router.get('/company/:id', async (req, res) => {
  const companyId = req.params.id;
  
  try {
    const query = `
      SELECT j.*, c.company_name, c.industry_sector
      FROM job_listings j
      JOIN companies_tbl c ON j.company_id = c.company_id
      WHERE j.company_id = ? AND j.status = 'Active'
      ORDER BY j.created_at DESC
    `;
    
    const [rows] = await db.query(query, [companyId]);
    
    res.status(200).json({
      success: true,
      count: rows.length,
      listings: rows
    });
  } catch (error) {
    console.error('Error fetching company job listings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching company job listings'
    });
  }
});

/**
 * @route GET /api/jobs/employer/my-listings
 * @desc Get all job listings created by the logged-in employer
 * @access Private (Employers only)
 */
router.get('/employer/my-listings', authenticateToken, authorizeRoles(['Employer']), async (req, res) => {
  try {
    // Get company_id from employer information
    const [employer] = await db.query(
      'SELECT company_id FROM employers_tbl WHERE user_id = ?',
      [req.user.user_id]
    );
    
    if (employer.length === 0 || !employer[0].company_id) {
      return res.status(400).json({
        success: false,
        message: 'No company associated with this employer'
      });
    }
    
    const company_id = employer[0].company_id;
    
    const query = `
      SELECT j.*, c.company_name, c.industry_sector,
        (SELECT COUNT(*) FROM applications a WHERE a.listing_id = j.listing_id) as application_count
      FROM job_listings j
      JOIN companies_tbl c ON j.company_id = c.company_id
      WHERE j.company_id = ?
      ORDER BY j.created_at DESC
    `;
    
    const [rows] = await db.query(query, [company_id]);
    
    res.status(200).json({
      success: true,
      count: rows.length,
      listings: rows
    });
  } catch (error) {
    console.error('Error fetching employer job listings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching employer job listings'
    });
  }
});

module.exports = router; 