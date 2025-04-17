// routes/faculties.routes.js
const express = require('express');
const router = express.Router();
const facultiesController = require('../controllers/faculties.controller');

// Archive a faculty
router.post('/faculties/archive/:id', facultiesController.archiveFaculty);

// Restore a faculty
router.post('/faculties/restore/:id', facultiesController.restoreFaculty);

module.exports = router;
