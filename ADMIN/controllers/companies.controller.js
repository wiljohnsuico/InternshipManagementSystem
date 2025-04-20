const db = require('../../BackEnd/src/config/database');

// Get all companies
exports.getAllCompanies = async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT 
                c.company_id,
                c.company_name,
                c.industry_sector,
                c.full_name,
                c.contact_number,
                c.address,
                c.description,
                c.intern_position,
                c.skills,
                c.intern_duration,
                u.email,
                u.password
            FROM companies_tbl AS c
            JOIN users_tbl AS u ON c.user_id = u.user_id
        `);
        res.json(results);
    } catch (err) {
        console.error('Error fetching companies:', err);
        res.status(500).json({ error: 'Failed to fetch companies' });
    }
};

// Get single company
exports.getCompanyById = async (req, res) => {
    const { id } = req.params;
    try {
        const [results] = await db.query(`
            SELECT 
                c.company_id,
                c.company_name,
                c.industry_sector,
                c.full_name,
                c.contact_number,
                c.address,
                c.description,
                c.intern_position,
                c.skills,
                c.intern_duration,
                u.email,
                u.password
            FROM companies_tbl AS c
            JOIN users_tbl AS u ON c.user_id = u.user_id
            WHERE c.company_id = ?
        `, [id]);

        res.json(results[0]);
    } catch (err) {
        console.error('Error fetching company:', err);
        res.status(500).json({ error: 'Failed to fetch company' });
    }
};

// Add new company
exports.addCompany = async (req, res) => {
    const {
        company_name,
        industry_sector,
        full_name,
        contact_number,
        address,
        description,
        intern_position,
        skills,
        intern_duration,
        email,
        password
    } = req.body;

    try {
        // First insert user into the users table
        const [userResult] = await db.query(`
            INSERT INTO users_tbl (email, password)
            VALUES (?, ?)
        `, [email, password]);

        const userId = userResult.insertId;  // Get the inserted user's id

        // Now insert the company with the associated user_id
        await db.query(`
            INSERT INTO companies_tbl (
                company_name, industry_sector, full_name,
                contact_number, address, description,
                intern_position, skills, intern_duration, user_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            company_name, industry_sector, full_name,
            contact_number, address, description,
            intern_position, skills, intern_duration, userId
        ]);

        res.status(201).json({ message: 'Company added successfully' });
    } catch (err) {
        console.error('Error adding company:', err);
        res.status(500).json({ error: 'Failed to add company' });
    }
};

// Update company
exports.updateCompany = async (req, res) => {
    const { id } = req.params;
    const {
        company_name,
        industry_sector,
        full_name,
        contact_number,
        address,
        description,
        intern_position,
        skills,
        intern_duration,
        email,
        password
    } = req.body;

    try {
        // First update user details
        await db.query(`
            UPDATE users_tbl SET
                email = ?, password = ?
            WHERE user_id = (SELECT user_id FROM companies_tbl WHERE company_id = ?)
        `, [email, password, id]);

        // Now update the company
        await db.query(`
            UPDATE companies_tbl SET
                company_name = ?, industry_sector = ?, full_name = ?,
                contact_number = ?, address = ?, description = ?,
                intern_position = ?, skills = ?, intern_duration = ?
            WHERE company_id = ?
        `, [
            company_name, industry_sector, full_name,
            contact_number, address, description,
            intern_position, skills, intern_duration, id
        ]);

        res.json({ message: 'Company updated successfully' });
    } catch (err) {
        console.error('Error updating company:', err);
        res.status(500).json({ error: 'Failed to update company' });
    }
};

// Delete company
exports.deleteCompany = async (req, res) => {
    const { id } = req.params;
    try {
        // First delete the company
        await db.query('DELETE FROM companies_tbl WHERE company_id = ?', [id]);

        // Then delete the associated user
        await db.query('DELETE FROM users_tbl WHERE user_id = (SELECT user_id FROM companies_tbl WHERE company_id = ?)', [id]);

        res.json({ message: 'Company and associated user deleted successfully' });
    } catch (err) {
        console.error('Error deleting company:', err);
        res.status(500).json({ error: 'Failed to delete company' });
    }
};
