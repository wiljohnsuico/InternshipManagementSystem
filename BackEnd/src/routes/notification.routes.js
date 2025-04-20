const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @route GET /api/notifications
 * @desc Get all notifications for a user
 * @access Private
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        
        const [notifications] = await db.query(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY timestamp DESC',
            [userId]
        );
        
        res.json({
            success: true,
            count: notifications.length,
            data: notifications
        });
    } catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching notifications',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route POST /api/notifications
 * @desc Create a new notification
 * @access Private
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { message, type, link } = req.body;
        const userId = req.user.user_id;
        
        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }
        
        const [result] = await db.query(
            'INSERT INTO notifications (user_id, message, type, link) VALUES (?, ?, ?, ?)',
            [userId, message, type || 'info', link || null]
        );
        
        if (result.affectedRows === 1) {
            const [newNotification] = await db.query(
                'SELECT * FROM notifications WHERE id = ?',
                [result.insertId]
            );
            
            res.status(201).json({
                success: true,
                data: newNotification[0]
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to create notification'
            });
        }
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating notification',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route PUT /api/notifications/:id
 * @desc Mark a notification as read
 * @access Private
 */
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user.user_id;
        
        // First check if the notification belongs to the user
        const [checkNotification] = await db.query(
            'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
            [notificationId, userId]
        );
        
        if (checkNotification.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found or not authorized'
            });
        }
        
        const [result] = await db.query(
            'UPDATE notifications SET `read` = true, updated_at = NOW() WHERE id = ?',
            [notificationId]
        );
        
        if (result.affectedRows === 1) {
            res.json({
                success: true,
                message: 'Notification marked as read'
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to update notification'
            });
        }
    } catch (error) {
        console.error('Error updating notification:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating notification',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route PUT /api/notifications/read-all
 * @desc Mark all notifications as read
 * @access Private
 */
router.put('/read-all', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        
        const [result] = await db.query(
            'UPDATE notifications SET `read` = true, updated_at = NOW() WHERE user_id = ? AND `read` = false',
            [userId]
        );
        
        res.json({
            success: true,
            message: `${result.affectedRows} notifications marked as read`
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating notifications',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route DELETE /api/notifications/:id
 * @desc Delete a notification
 * @access Private
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user.user_id;
        
        // First check if the notification belongs to the user
        const [checkNotification] = await db.query(
            'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
            [notificationId, userId]
        );
        
        if (checkNotification.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found or not authorized'
            });
        }
        
        const [result] = await db.query(
            'DELETE FROM notifications WHERE id = ?',
            [notificationId]
        );
        
        if (result.affectedRows === 1) {
            res.json({
                success: true,
                message: 'Notification deleted successfully'
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to delete notification'
            });
        }
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting notification',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route DELETE /api/notifications
 * @desc Delete all notifications for a user
 * @access Private
 */
router.delete('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        
        const [result] = await db.query(
            'DELETE FROM notifications WHERE user_id = ?',
            [userId]
        );
        
        res.json({
            success: true,
            message: `${result.affectedRows} notifications deleted successfully`
        });
    } catch (error) {
        console.error('Error deleting all notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting notifications',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router; 