const db = require('../../BackEnd/src/config/database');

// Get all interns with user info (including password)
const getAllInterns = async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT interns_tbl.*, users_tbl.email, users_tbl.password 
            FROM interns_tbl
            JOIN users_tbl ON interns_tbl.user_id = users_tbl.user_id
        `);
        res.json(results);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch interns' });
    }
};

// Get intern by ID
const getInternById = async (req, res) => {
    const { id } = req.params;
    try {
        const [results] = await db.query(`
            SELECT interns_tbl.*, users_tbl.email, users_tbl.password 
            FROM interns_tbl
            JOIN users_tbl ON interns_tbl.user_id = users_tbl.user_id
            WHERE interns_tbl.intern_id = ?
        `, [id]);

        if (results.length === 0) {
            return res.status(404).json({ error: 'Intern not found' });
        }
        res.json(results[0]);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch intern' });
    }
};

// Update intern
const updateIntern = async (req, res) => {
    const { id } = req.params;
    const {
        user_id,
        student_no,
        first_name,
        middle_name,
        last_name,
        contact_number,
        year_level,
        section,
        dept,
        course,
        skills,
        intern_fields,
        rsm_cv,
        status
    } = req.body;

    const sql = `
        UPDATE interns_tbl SET 
            user_id = ?, 
            student_no = ?, 
            first_name = ?, 
            middle_name = ?, 
            last_name = ?, 
            contact_number = ?, 
            year_level = ?, 
            section = ?, 
            dept = ?, 
            course = ?, 
            skills = ?, 
            intern_fields = ?, 
            rsm_cv = ?, 
            status = ?
         WHERE intern_id = ?
    `;
    const values = [
        user_id, student_no, first_name, middle_name, last_name, contact_number,
        year_level, section, dept, course, skills, intern_fields,
        rsm_cv || null, status, id
    ];

    try {
        await db.query(sql, values);
        res.json({ message: 'Intern updated successfully' });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to update intern', details: err });
    }
};

// Delete intern
const deleteIntern = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM interns_tbl WHERE intern_id = ?', [id]);
        res.json({ message: 'Intern deleted successfully' });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to delete intern' });
    }
};

// Accept Intern
const acceptIntern = (req, res) => {
    const internId = req.params.id;
    
    // Update the intern's status to "accepted" in the database
    db.query('UPDATE interns_tbl SET status = "accepted" WHERE intern_id = ?', [internId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Error accepting intern', error: err });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: `Intern ${internId} not found.` });
        }
        return res.status(200).json({ message: `Intern ${internId} accepted.` });
    });
};
  
// Reject Intern
const rejectIntern = (req, res) => {
    const internId = req.params.id;
    
    // Update the intern's status to "rejected" in the database
    db.query('UPDATE interns_tbl SET status = "rejected" WHERE intern_id = ?', [internId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Error rejecting intern', error: err });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: `Intern ${internId} not found.` });
        }
        return res.status(200).json({ message: `Intern ${internId} rejected.` });
    });
};


// ✅ Export all at once
module.exports = {
    getAllInterns,
    getInternById,
    updateIntern,
    deleteIntern,
    acceptIntern,
    rejectIntern
};
