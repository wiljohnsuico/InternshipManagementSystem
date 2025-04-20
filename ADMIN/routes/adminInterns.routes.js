const express = require('express');
const router = express.Router();
const adminInternController = require('../controllers/adminInterns.controller');

// Routes for Interns
router.get('/', adminInternController.getAllInterns);
router.get('/:id', adminInternController.getInternById);
router.put('/:id', adminInternController.updateIntern);
router.delete('/:id', adminInternController.deleteIntern);

// Additional routes for accepting and rejecting interns
router.patch('/accept/:id', adminInternController.acceptIntern);  // Accept intern
router.patch('/reject/:id', adminInternController.rejectIntern);  // Reject intern

module.exports = router;
