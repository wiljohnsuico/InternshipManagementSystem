const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Get all announcements
router.get('/', async (req, res) => {
    try {
        const [announcements] = await db.query(
            'SELECT * FROM announcements ORDER BY created_at DESC'
        );
        res.json(announcements);
    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ message: 'Error fetching announcements' });
    }
});

// Create new announcement (admin only)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO announcements (title, content) VALUES (?, ?)',
            [title, content]
        );

        const [announcement] = await db.query(
            'SELECT * FROM announcements WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json(announcement[0]);
    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({ message: 'Error creating announcement' });
    }
});

// Update announcement (admin only)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required' });
    }

    try {
        const [result] = await db.query(
            'UPDATE announcements SET title = ?, content = ? WHERE id = ?',
            [title, content, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        const [announcement] = await db.query(
            'SELECT * FROM announcements WHERE id = ?',
            [id]
        );

        res.json(announcement[0]);
    } catch (error) {
        console.error('Error updating announcement:', error);
        res.status(500).json({ message: 'Error updating announcement' });
    }
});

// Delete announcement (admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.query(
            'DELETE FROM announcements WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        res.json({ message: 'Announcement deleted successfully' });
    } catch (error) {
        console.error('Error deleting announcement:', error);
        res.status(500).json({ message: 'Error deleting announcement' });
    }
});

module.exports = router; 