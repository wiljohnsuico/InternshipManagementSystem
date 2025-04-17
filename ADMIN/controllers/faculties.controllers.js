// controllers/faculties.controller.js
const db = require('../config/db'); // adjust the path if needed

exports.archiveFaculty = (req, res) => {
    const facultyId = req.params.id;

    const archiveQuery = `
        INSERT INTO archive_faculties_tbl 
        SELECT * FROM faculties_tbl WHERE faculty_id = ?;
    `;
    const deleteQuery = `DELETE FROM faculties_tbl WHERE faculty_id = ?;`;

    db.query(archiveQuery, [facultyId], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to archive faculty' });

        db.query(deleteQuery, [facultyId], (err2) => {
            if (err2) return res.status(500).json({ error: 'Failed to delete from faculties_tbl' });

            res.json({ message: 'Faculty archived successfully' });
        });
    });
};

exports.restoreFaculty = (req, res) => {
    const facultyId = req.params.id;

    const restoreQuery = `
        INSERT INTO faculties_tbl 
        SELECT * FROM archive_faculties_tbl WHERE faculty_id = ?;
    `;
    const deleteArchive = `DELETE FROM archive_faculties_tbl WHERE faculty_id = ?;`;

    db.query(restoreQuery, [facultyId], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to restore faculty' });

        db.query(deleteArchive, [facultyId], (err2) => {
            if (err2) return res.status(500).json({ error: 'Failed to delete from archive_faculties_tbl' });

            res.json({ message: 'Faculty restored successfully' });
        });
    });
};
