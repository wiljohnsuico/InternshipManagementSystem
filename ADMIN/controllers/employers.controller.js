const db = require('../../BackEnd/src/config/database');

// Get all employers
exports.getAllEmployers = async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM employers_tbl');
        res.json(results);
    } catch (err) {
        console.error("Error fetching employers:", err);
        return res.status(500).json({ error: 'Failed to fetch employers' });
    }
};

// Get employer by ID
exports.getEmployerById = async (req, res) => {
    const { id } = req.params;
    try {
        const [results] = await db.query('SELECT * FROM employers_tbl WHERE employer_id = ?', [id]);
        if (results.length === 0) {
            return res.status(404).json({ error: 'Employer not found' });
        }
        res.json(results[0]);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch employer' });
    }
};

// Add a new employer
exports.addEmployer = async (req, res) => {
    const { first_name, middle_name, last_name, email, password, companyName } = req.body;
    try {
        // Step 1: Insert email and password into users_tbl
        const [userResult] = await db.query(
            'INSERT INTO users_tbl (email, password) VALUES (?, ?)', 
            [email, password]
        );

        // Step 2: Insert employer-specific data into employers_tbl, using the user_id from users_tbl
        await db.query(
            'INSERT INTO employers_tbl (first_name, middle_name, last_name, company_name, user_id) VALUES (?, ?, ?, ?, ?)', 
            [first_name, middle_name, last_name, companyName, userResult.insertId]
        );

        res.status(201).json({ message: 'Employer added successfully' });
    } catch (err) {
        console.error("Error adding employer:", err);
        return res.status(500).json({ error: 'Failed to add employer' });
    }
};

// Update an employer
exports.updateEmployer = async (req, res) => {
    const { id } = req.params;
    const { first_name, middle_name, last_name, email, password, companyName } = req.body;
    try {
        await db.query(
            'UPDATE employers_tbl SET first_name = ?, middle_name = ?, last_name = ?, email = ?, password = ?, companyName = ? WHERE employer_id = ?',
            [first_name, middle_name, last_name, email, password, companyName, id]
        );
        res.json({ message: 'Employer updated successfully' });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to update employer' });
    }
};

// Delete an employer
exports.deleteEmployer = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM employers_tbl WHERE employer_id = ?', [id]);
        res.json({ message: 'Employer deleted successfully' });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to delete employer' });
    }
};
