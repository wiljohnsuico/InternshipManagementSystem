const db = require('../../BackEnd/src/config/database');

// Get all faculties with their email and password
exports.getAllFaculties = async (req, res) => {
    const query = `
        SELECT 
            faculties_tbl.faculty_id, 
            faculties_tbl.first_name, 
            faculties_tbl.middle_name, 
            faculties_tbl.last_name, 
            faculties_tbl.dept, 
            faculties_tbl.course, 
            faculties_tbl.contact_number, 
            faculties_tbl.date_registered,
            users_tbl.email,
            users_tbl.password
        FROM 
            faculties_tbl
        INNER JOIN 
            users_tbl ON faculties_tbl.user_id = users_tbl.user_id
    `;
    try {
        const [results] = await db.query(query);  // Await the promise to get the results
        res.json(results);
    } catch (err) {
        console.error("Error fetching faculties:", err);
        return res.status(500).json({ error: 'Failed to fetch faculties' });
    }
};

// Get faculty by ID with their email and password
exports.getFacultyById = async (req, res) => {
    const { id } = req.params;
    try {
        const [results] = await db.query(`
            SELECT f.faculty_id, f.first_name, f.middle_name, f.last_name, f.dept, f.course, f.contact_number, u.email, u.password
            FROM faculties_tbl f
            JOIN users_tbl u ON f.user_id = u.user_id
            WHERE f.faculty_id = ?`, [id]);
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Faculty not found' });
        }
        
        res.json(results[0]);
    } catch (err) {
        console.error("Error fetching faculty:", err);
        return res.status(500).json({ error: 'Failed to fetch faculty' });
    }
};

// Add Faculty Controller
exports.addFaculty = async (req, res) => {
    const { first_name, middle_name, last_name, email, password, contact_number, department, course } = req.body;
    try {
        // Check if the required fields are provided
        if (!first_name || !middle_name || !last_name || !email || !password || !department || !course) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if the email already exists in the users_tbl
        const [[existingUser]] = await db.query('SELECT COUNT(*) AS count FROM users_tbl WHERE email = ?', [email]);
        if (existingUser.count > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Insert into users_tbl first (this creates the user)
        const [userResult] = await db.query(
            'INSERT INTO users_tbl (email, password, user_role) VALUES (?, ?, ?)', 
            [email, password, 'faculty']
        );
        const userId = userResult.insertId;

        // Insert into faculties_tbl (this links the faculty to the user)
        await db.query(
            'INSERT INTO faculties_tbl (first_name, middle_name, last_name, user_id, dept, course, contact_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [first_name, middle_name, last_name, userId, department, course, contact_number]
        );

        res.status(201).json({ message: 'Faculty added successfully' });
    } catch (err) {
        console.error('Error adding faculty:', err);
        res.status(500).json({ error: 'Failed to add faculty' });
    }
};

// Update a faculty's details, including their email and password
exports.updateFaculty = async (req, res) => {
    const { id } = req.params;
    const { first_name, middle_name, last_name, dept, course, contact_number, email, password } = req.body;

    console.log("Incoming update data:", req.body); // Log incoming data
    console.log("Data received:", {
        first_name, middle_name, last_name, dept, course, contact_number, email, password
    });

    // 1. Check if all required fields are provided
    if (!first_name || !last_name || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // 2. Check if the new email is already in use
        const [[{ count }]] = await db.query('SELECT COUNT(*) AS count FROM users_tbl WHERE email = ? AND user_id != (SELECT user_id FROM faculties_tbl WHERE faculty_id = ?)', [email, id]);

        if (count > 0) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        // 3. Update the email and password in the users_tbl first
        await db.query(
            'UPDATE users_tbl SET email = ?, password = ? WHERE user_id = (SELECT user_id FROM faculties_tbl WHERE faculty_id = ?)',
            [email, password, id]
        );

        // 4. Now update the faculty details in faculties_tbl
        await db.query(
            'UPDATE faculties_tbl SET first_name = ?, middle_name = ?, last_name = ?, dept = ?, course = ?, contact_number = ? WHERE faculty_id = ?',
            [first_name, middle_name, last_name, dept, course, contact_number, id]
        );
        
        res.json({ message: 'Faculty updated successfully' });
    } catch (err) {
        console.error("Error updating faculty:", err);
        return res.status(500).json({ error: 'Failed to update faculty' });
    }
};

// Delete a faculty
exports.deleteFaculty = async (req, res) => {
    const { id } = req.params;

    try {
        // Step 1: Get the user_id before deleting the faculty
        const [[faculty]] = await db.query('SELECT user_id FROM faculties_tbl WHERE faculty_id = ?', [id]);
        
        if (!faculty) {
            return res.status(404).json({ error: 'Faculty not found' });
        }

        const userId = faculty.user_id;

        // Step 2: Delete the faculty
        await db.query('DELETE FROM faculties_tbl WHERE faculty_id = ?', [id]);

        // Step 3: Delete the corresponding user
        await db.query('DELETE FROM users_tbl WHERE user_id = ?', [userId]);

        res.json({ message: 'Faculty and associated user deleted successfully' });
    } catch (err) {
        console.error("Error deleting faculty:", err);
        return res.status(500).json({ error: 'Failed to delete faculty' });
    }
};

// Archive a faculty (move from active to archive)
exports.archiveFaculty = async (req, res) => {
    const { id } = req.params;

    try {
        // Step 1: Get the faculty details
        const [[faculty]] = await db.query('SELECT * FROM faculties_tbl WHERE faculty_id = ?', [id]);
        
        if (!faculty) {
            return res.status(404).json({ error: 'Faculty not found' });
        }

        // Step 2: Insert into the archive table
        await db.query('INSERT INTO archive_faculties_tbl SELECT * FROM faculties_tbl WHERE faculty_id = ?', [id]);

        // Step 3: Delete from the active table
        await db.query('DELETE FROM faculties_tbl WHERE faculty_id = ?', [id]);

        res.json({ message: 'Faculty archived successfully' });
    } catch (err) {
        console.error('Error archiving faculty:', err);
        return res.status(500).json({ error: 'Failed to archive faculty' });
    }
};

// Restore archived faculty (move from archive back to active)
exports.restoreFaculty = async (req, res) => {
    const { id } = req.params;

    try {
        // Step 1: Get the faculty from the archive table
        const [[faculty]] = await db.query('SELECT * FROM archive_faculties_tbl WHERE faculty_id = ?', [id]);

        if (!faculty) {
            return res.status(404).json({ error: 'Archived faculty not found' });
        }

        // Step 2: Insert back into the active table
        await db.query('INSERT INTO faculties_tbl SELECT * FROM archive_faculties_tbl WHERE faculty_id = ?', [id]);

        // Step 3: Delete from the archive table
        await db.query('DELETE FROM archive_faculties_tbl WHERE faculty_id = ?', [id]);

        res.json({ message: 'Faculty restored successfully' });
    } catch (err) {
        console.error('Error restoring faculty:', err);
        return res.status(500).json({ error: 'Failed to restore faculty' });
    }
};

// Permanently delete an archived faculty
exports.deleteArchivedFaculty = async (req, res) => {
    const { id } = req.params;

    try {
        // Step 1: Get the archived faculty
        const [[faculty]] = await db.query('SELECT * FROM archive_faculties_tbl WHERE faculty_id = ?', [id]);

        if (!faculty) {
            return res.status(404).json({ error: 'Archived faculty not found' });
        }

        // Step 2: Delete from the archive table permanently
        await db.query('DELETE FROM archive_faculties_tbl WHERE faculty_id = ?', [id]);

        res.json({ message: 'Archived faculty permanently deleted' });
    } catch (err) {
        console.error('Error deleting archived faculty:', err);
        return res.status(500).json({ error: 'Failed to delete archived faculty' });
    }
};
