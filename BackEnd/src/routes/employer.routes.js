const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

/**
 * @route GET /api/employers/me
 * @desc Get the profile of the currently logged in employer
 * @access Private (Employers only)
 */
router.get('/me', authenticateToken, authorizeRoles(['Employer']), async (req, res) => {
  try {
    const userId = req.user.user_id;
    console.log(`Fetching current employer profile for user_id: ${userId}`);
    
    const query = `
      SELECT e.id, e.position, e.company_id, 
             c.company_name, c.industry_sector, c.company_description as description,
             c.company_location as location, c.company_website as website, 
             c.company_size as size, c.founded_year,
             u.first_name, u.last_name, u.email, u.contact_number
      FROM employers_tbl e
      JOIN users_tbl u ON e.user_id = u.user_id
      JOIN companies_tbl c ON e.company_id = c.company_id
      WHERE e.user_id = ? AND u.is_deleted = 0
    `;
    
    const [rows] = await db.query(query, [userId]);
    
    if (rows.length === 0) {
      console.log(`No employer profile found for user_id: ${userId}`);
      return res.status(404).json({
        success: false,
        message: 'Employer profile not found'
      });
    }
    
    const employer = rows[0];
    console.log(`Found employer profile: ${employer.first_name} ${employer.last_name}`);
    
    // Format the response
    const response = {
      id: employer.id,
      name: `${employer.company_name}`,
      industry: employer.industry_sector,
      description: employer.description,
      location: employer.location || '', 
      website: employer.website || '', 
      size: employer.size || '',
      founded_year: employer.founded_year || '',
      stats: {
        jobs_posted: 0,
        internships_offered: 0,
        students_hired: 0
      },
      contact_info: {
        name: `${employer.first_name} ${employer.last_name}`,
        position: employer.position,
        email: employer.email,
        phone: employer.contact_number
      }
    };
    
    // Get job count for statistics
    try {
      const [jobStats] = await db.query(
        `SELECT COUNT(*) as job_count FROM job_listings WHERE company_id = ?`, 
        [employer.company_id]
      );
      
      if (jobStats.length > 0) {
        response.stats.jobs_posted = jobStats[0].job_count || 0;
        // For now, all jobs are considered internships too
        response.stats.internships_offered = jobStats[0].job_count || 0;
      }
    } catch (statsError) {
      console.error('Error fetching job stats:', statsError);
    }
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching employer profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching employer profile'
    });
  }
});

/**
 * @route GET /api/employers/me/contacts
 * @desc Get contacts for the currently logged in employer
 * @access Private (Employers only)
 */
router.get('/me/contacts', authenticateToken, authorizeRoles(['Employer']), async (req, res) => {
  try {
    const userId = req.user.user_id;
    console.log(`Fetching contacts for authenticated employer user_id: ${userId}`);
    
    // This is a mock implementation - in a real system, you would fetch this from a database
    // Here we're just returning the primary contact from the employer table
    const query = `
      SELECT e.position, e.id, e.user_id,
             u.first_name, u.last_name, u.email, u.contact_number
      FROM employers_tbl e
      JOIN users_tbl u ON e.user_id = u.user_id
      WHERE e.user_id = ? AND u.is_deleted = 0
    `;
    
    const [rows] = await db.query(query, [userId]);
    
    if (rows.length === 0) {
      console.log(`No contacts found for authenticated employer user_id: ${userId}`);
      return res.status(404).json({
        success: false,
        message: 'Employer contacts not found'
      });
    }
    
    const contact = rows[0];
    console.log(`Found authenticated employer contact: ${contact.first_name} ${contact.last_name}`);
    
    // Return the primary contact as part of a contacts array
    const contacts = [
      {
        id: "contact-1",
        name: `${contact.first_name} ${contact.last_name}`,
        position: contact.position,
        email: contact.email,
        phone: contact.contact_number
      }
    ];
    
    res.status(200).json(contacts);
  } catch (error) {
    console.error('Error fetching authenticated employer contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching employer contacts'
    });
  }
});

/**
 * @route GET /api/employers/me/jobs
 * @desc Get job listings for the currently logged in employer
 * @access Private (Employers only)
 */
router.get('/me/jobs', authenticateToken, authorizeRoles(['Employer']), async (req, res) => {
  try {
    const userId = req.user.user_id;
    console.log(`Fetching jobs for authenticated employer user_id: ${userId}`);
    
    // First get the company_id associated with this employer
    const [employer] = await db.query(
      'SELECT company_id FROM employers_tbl WHERE user_id = ?',
      [userId]
    );
    
    if (employer.length === 0) {
      console.log(`No employer found with user_id: ${userId}`);
      return res.status(404).json({
        success: false,
        message: 'Employer not found'
      });
    }
    
    const companyId = employer[0].company_id;
    console.log(`Found company ID: ${companyId} for authenticated employer`);
    
    // Now get the job listings for this company
    const query = `
      SELECT j.*, c.company_name, c.industry_sector
      FROM job_listings j
      JOIN companies_tbl c ON j.company_id = c.company_id
      WHERE j.company_id = ? 
      ORDER BY j.created_at DESC
    `;
    
    const [rows] = await db.query(query, [companyId]);
    console.log(`Found ${rows.length} job listings for authenticated employer company ${companyId}`);
    
    // Format the jobs for the frontend
    const jobs = rows.map(job => ({
      id: job.listing_id,
      title: job.job_title,
      location: job.location,
      job_type: "Internship",
      status: job.status,
      posted_date: job.created_at,
      short_description: job.description ? (job.description.substring(0, 150) + '...') : 'No description',
      is_paid: job.is_paid
    }));
    
    res.status(200).json(jobs);
  } catch (error) {
    console.error('Error fetching authenticated employer job listings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching employer job listings'
    });
  }
});

/**
 * @route PUT /api/employers/me/profile
 * @desc Update the profile of the currently logged in employer
 * @access Private (Employers only)
 */
router.put('/me/profile', authenticateToken, authorizeRoles(['Employer', 'employer']), async (req, res) => {
  try {
    const userId = req.user.user_id;
    console.log(`Updating employer profile for user_id: ${userId}`);
    console.log('Request body:', req.body);
    console.log('Request files:', req.files ? Object.keys(req.files) : 'No files');
    
    // Get employer record to find company_id
    const [employer] = await db.query(
      'SELECT company_id FROM employers_tbl WHERE user_id = ?',
      [userId]
    );
    
    if (employer.length === 0) {
      console.log(`No employer record found for user_id: ${userId}`);
      return res.status(404).json({
        success: false,
        message: 'Employer record not found'
      });
    }
    
    const companyId = employer[0].company_id;
    
    // Get company data to update
    const { name, industry, size, location, website, founded_year, description } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required'
      });
    }
    
    // Log the data that will be used for update
    console.log('Data for update:', {
      name, industry, size, location, website, founded_year, description,
      companyId
    });
    
    try {
      // Check database structure first
      const [columns] = await db.query('SHOW COLUMNS FROM companies_tbl');
      const columnNames = columns.map(col => col.Field);
      console.log('Companies table columns:', columnNames);
      
      // Build dynamic query based on available columns
      const updateFields = [];
      const values = [];
      
      // Always update name (required field)
      updateFields.push('company_name = ?');
      values.push(name);
      
      // Industry field
      if (columnNames.includes('industry_sector')) {
        updateFields.push('industry_sector = ?');
        values.push(industry || '');
      }
      
      // Size field - check for correct column name
      if (columnNames.includes('company_size')) {
        updateFields.push('company_size = ?');
        values.push(size || '');
      }
      
      // Location field
      if (columnNames.includes('company_location')) {
        updateFields.push('company_location = ?');
        values.push(location || '');
      }
      
      // Website field
      if (columnNames.includes('company_website')) {
        updateFields.push('company_website = ?');
        values.push(website || '');
      }
      
      // Founded year field
      if (columnNames.includes('founded_year')) {
        updateFields.push('founded_year = ?');
        values.push(founded_year || '');
      }
      
      // Description field
      if (columnNames.includes('company_description')) {
        updateFields.push('company_description = ?');
        values.push(description || '');
      }
      
      // Add timestamp if it exists
      if (columnNames.includes('updated_at')) {
        updateFields.push('updated_at = NOW()');
      }
      
      // Add company_id to values
      values.push(companyId);
      
      // Build and execute the query
      const updateCompanyQuery = `
        UPDATE companies_tbl 
        SET ${updateFields.join(', ')}
        WHERE company_id = ?
      `;
      
      console.log('Executing query:', updateCompanyQuery);
      console.log('With values:', values);
      
      await db.query(updateCompanyQuery, values);
      
      console.log(`Updated company information for ID: ${companyId}`);
    } catch (dbError) {
      console.error('Database error during company update:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update company information: ' + dbError.message
      });
    }
    
    // Handle logo upload if present
    let logoUrl = null;
    if (req.files && req.files.logo) {
      try {
        const logoFile = req.files.logo;
        console.log('Logo upload received:', logoFile.name, 'size:', logoFile.size);
        
        // Create directory if it doesn't exist
        const uploadDir = path.join(__dirname, '../..', 'uploads/logos');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
          console.log(`Created directory: ${uploadDir}`);
        }
        
        // Generate unique filename
        const fileName = `${Date.now()}-${logoFile.name.replace(/\s+/g, '_')}`;
        const uploadPath = path.join(uploadDir, fileName);
        
        // Save the file
        await logoFile.mv(uploadPath);
        console.log(`Logo saved to: ${uploadPath}`);
        
        // Update the logo URL in the database
        logoUrl = `/uploads/logos/${fileName}`;
        await db.query(
          'UPDATE companies_tbl SET logo_url = ? WHERE company_id = ?',
          [logoUrl, companyId]
        );
        
        console.log(`Updated logo URL in database: ${logoUrl}`);
      } catch (fileError) {
        console.error('Error handling file upload:', fileError);
        // Continue with the update even if file upload fails
        // but include error information in the response
        return res.status(200).json({
          success: true,
          message: 'Profile updated but logo upload failed',
          error: fileError.message,
          name,
          industry,
          size,
          location,
          website,
          founded_year,
          description
        });
      }
    }
    
    // Get updated company profile
    try {
      const [updatedCompany] = await db.query(
        'SELECT * FROM companies_tbl WHERE company_id = ?',
        [companyId]
      );

      if (updatedCompany.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Company not found after update'
        });
      }

      // Format the response - safely extract fields and provide fallbacks
      const response = {
        id: req.user.user_id,
        name: updatedCompany[0].company_name || '',
        industry: updatedCompany[0].industry_sector || '',
        size: updatedCompany[0].company_size || '',
        location: updatedCompany[0].company_location || '', 
        website: updatedCompany[0].company_website || '',
        founded_year: updatedCompany[0].founded_year || '',
        description: updatedCompany[0].company_description || '',
        logo_url: logoUrl || updatedCompany[0].logo_url || '',
        updated_at: updatedCompany[0].updated_at || new Date().toISOString()
      };

      console.log(`Profile updated successfully for company ID: ${companyId}`);
      res.status(200).json(response);
    } catch (error) {
      console.error('Error getting updated company data:', error);
      return res.status(500).json({
        success: false,
        message: 'Profile was updated but there was an error retrieving the updated data: ' + error.message
      });
    }
  } catch (error) {
    console.error('Error updating employer profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating employer profile: ' + error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @route GET /api/employers/:id
 * @desc Get employer profile by ID
 * @access Public
 */
router.get('/:id', async (req, res) => {
  try {
    const employerId = req.params.id;
    
    // Add debug logging
    console.log(`Fetching employer profile for ID: ${employerId}`);
    
    // First try to get by id field
    let query = `
      SELECT e.id, e.position, e.company_id, e.user_id,
             c.company_name, c.industry_sector, c.company_description as description,
             c.company_location as location, c.company_website as website, 
             c.company_size as size, c.founded_year,
             u.first_name, u.last_name, u.email, u.contact_number
      FROM employers_tbl e
      JOIN users_tbl u ON e.user_id = u.user_id
      JOIN companies_tbl c ON e.company_id = c.company_id
      WHERE (e.id = ? OR e.user_id = ?) AND u.is_deleted = 0
    `;
    
    const [rows] = await db.query(query, [employerId, employerId]);
    
    if (rows.length === 0) {
      console.log(`No employer found with ID: ${employerId}`);
      return res.status(404).json({
        success: false,
        message: 'Employer not found'
      });
    }
    
    const employer = rows[0];
    console.log(`Found employer: ${employer.first_name} ${employer.last_name} from company ${employer.company_name}`);
    
    // Format the response
    const response = {
      id: employer.id,
      user_id: employer.user_id,
      name: `${employer.company_name}`,
      industry: employer.industry_sector,
      description: employer.description,
      location: employer.location || '', 
      website: employer.website || '', 
      size: employer.size || '',
      founded_year: employer.founded_year || '',
      stats: {
        jobs_posted: 0, // These should be filled with real data when available
        internships_offered: 0,
        students_hired: 0
      },
      contact_info: {
        name: `${employer.first_name} ${employer.last_name}`,
        position: employer.position,
        email: employer.email,
        phone: employer.contact_number
      }
    };
    
    // Get job count for statistics
    try {
      const [jobStats] = await db.query(
        `SELECT COUNT(*) as job_count FROM job_listings WHERE company_id = ?`, 
        [employer.company_id]
      );
      
      if (jobStats.length > 0) {
        response.stats.jobs_posted = jobStats[0].job_count || 0;
        // For now, all jobs are considered internships too
        response.stats.internships_offered = jobStats[0].job_count || 0;
      }
    } catch (statsError) {
      console.error('Error fetching job stats:', statsError);
    }
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching employer profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching employer profile'
    });
  }
});

/**
 * @route GET /api/employers/:id/contacts
 * @desc Get employer contacts
 * @access Public
 */
router.get('/:id/contacts', async (req, res) => {
  try {
    const employerId = req.params.id;
    console.log(`Fetching contacts for employer ID: ${employerId}`);
    
    // This is a mock implementation - in a real system, you would fetch this from a database
    // Here we're just returning the primary contact from the employer table
    const query = `
      SELECT e.position, e.id, e.user_id,
             u.first_name, u.last_name, u.email, u.contact_number
      FROM employers_tbl e
      JOIN users_tbl u ON e.user_id = u.user_id
      WHERE (e.id = ? OR e.user_id = ?) AND u.is_deleted = 0
    `;
    
    const [rows] = await db.query(query, [employerId, employerId]);
    
    if (rows.length === 0) {
      console.log(`No contacts found for employer ID: ${employerId}`);
      return res.status(404).json({
        success: false,
        message: 'Employer contacts not found'
      });
    }
    
    const contact = rows[0];
    console.log(`Found contact: ${contact.first_name} ${contact.last_name}`);
    
    // Return the primary contact as part of a contacts array
    const contacts = [
      {
        id: "contact-1",
        name: `${contact.first_name} ${contact.last_name}`,
        position: contact.position,
        email: contact.email,
        phone: contact.contact_number
      }
    ];
    
    res.status(200).json(contacts);
  } catch (error) {
    console.error('Error fetching employer contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching employer contacts'
    });
  }
});

/**
 * @route GET /api/employers/:id/jobs
 * @desc Get all job listings for a specific employer
 * @access Public
 */
router.get('/:id/jobs', async (req, res) => {
  try {
    const employerId = req.params.id;
    console.log(`Fetching jobs for employer ID: ${employerId}`);
    
    // First get the company_id associated with this employer
    const [employer] = await db.query(
      'SELECT company_id FROM employers_tbl WHERE id = ? OR user_id = ?',
      [employerId, employerId]
    );
    
    if (employer.length === 0) {
      console.log(`No employer found with ID: ${employerId}`);
      return res.status(404).json({
        success: false,
        message: 'Employer not found'
      });
    }
    
    const companyId = employer[0].company_id;
    console.log(`Found company ID: ${companyId}`);
    
    // Now get the job listings for this company
    const query = `
      SELECT j.*, c.company_name, c.industry_sector
      FROM job_listings j
      JOIN companies_tbl c ON j.company_id = c.company_id
      WHERE j.company_id = ? AND j.status = 'Active'
      ORDER BY j.created_at DESC
    `;
    
    const [rows] = await db.query(query, [companyId]);
    console.log(`Found ${rows.length} job listings for company ${companyId}`);
    
    // Format the jobs for the frontend
    const jobs = rows.map(job => ({
      id: job.listing_id,
      title: job.job_title,
      location: job.location,
      job_type: "Internship",
      posted_date: job.created_at,
      short_description: job.description ? (job.description.substring(0, 150) + '...') : 'No description',
      is_paid: job.is_paid
    }));
    
    res.status(200).json(jobs);
  } catch (error) {
    console.error('Error fetching employer job listings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching employer job listings'
    });
  }
});

/**
 * @route PUT /api/employers/:id/profile
 * @desc Update employer profile by ID (admin access or public API with auth)
 * @access Private (Admin) or specific authorization
 */
router.put('/:id/profile', async (req, res) => {
  try {
    const employerId = req.params.id;
    console.log(`External update for employer profile ID: ${employerId}`);
    console.log('Request body:', req.body);
    
    // This endpoint would require special authorization
    // Here we're assuming it's used for testing or admin purposes
    
    // Get employer record to find company_id
    const [employer] = await db.query(
      'SELECT company_id FROM employers_tbl WHERE id = ? OR user_id = ?',
      [employerId, employerId]
    );
    
    if (employer.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employer not found'
      });
    }
    
    const companyId = employer[0].company_id;
    
    // Get company data to update
    const { name, industry, size, location, website, founded_year, description } = req.body;
    
    // Log the data that will be used for update
    console.log('Data for update:', {
      name, industry, size, location, website, founded_year, description,
      companyId
    });
    
    // Update company info
    const updateCompanyQuery = `
      UPDATE companies_tbl 
      SET 
        company_name = ?,
        industry_sector = ?,
        company_size = ?,
        company_location = ?,
        company_website = ?,
        founded_year = ?,
        company_description = ?,
        updated_at = NOW()
      WHERE company_id = ?
    `;
    
    await db.query(updateCompanyQuery, [
      name, 
      industry, 
      size, 
      location, 
      website, 
      founded_year, 
      description,
      companyId
    ]);
    
    // Handle logo upload if present
    let logoUrl = null;
    if (req.files && req.files.logo) {
      console.log('Logo upload would be processed here:', req.files.logo.name);
      
      // Save logo URL to database
      await db.query(
        'UPDATE companies_tbl SET logo_url = ? WHERE company_id = ?',
        ['/uploads/logos/' + req.files.logo.name, companyId]
      );
      
      logoUrl = '/uploads/logos/' + req.files.logo.name;
    }
    
    // Get updated company profile
    const [updatedCompany] = await db.query(
      'SELECT * FROM companies_tbl WHERE company_id = ?',
      [companyId]
    );
    
    // Format the response
    const response = {
      id: employerId,
      name: updatedCompany[0].company_name,
      industry: updatedCompany[0].industry_sector,
      size: updatedCompany[0].company_size || '',
      location: updatedCompany[0].company_location || '',
      website: updatedCompany[0].company_website || '',
      founded_year: updatedCompany[0].founded_year || '',
      description: updatedCompany[0].company_description || '',
      logo_url: logoUrl || updatedCompany[0].logo_url || '',
      updated_at: updatedCompany[0].updated_at
    };
    
    console.log(`Profile updated successfully for company ID: ${companyId}`);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating employer profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating employer profile: ' + error.message
    });
  }
});

module.exports = router; 