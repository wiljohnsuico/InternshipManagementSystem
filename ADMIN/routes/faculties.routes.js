const express = require('express');
const path = require('path');  // Add this line to import the path module
const router = express.Router();
console.log('Attempting to load:', path.join(__dirname, '../controllers/faculties.controller.js'));
const facultiesController = require(path.resolve(__dirname, '../controllers/faculties.controller'));

// Define routes
router.get('/', facultiesController.getAllFaculties);  // GET all faculties
router.get('/:id', facultiesController.getFacultyById);  // GET a specific faculty by ID
router.post('/', facultiesController.addFaculty);  // POST new faculty
router.put('/:id', facultiesController.updateFaculty);  // PUT update faculty by ID
router.delete('/:id', facultiesController.deleteFaculty);  // DELETE faculty by ID

// Archive routes
router.post('/archive/:id', facultiesController.archiveFaculty);  // Archive faculty by ID
router.post('/restore/:id', facultiesController.restoreFaculty);  // Restore faculty from archive by ID
router.delete('/archive/:id', facultiesController.deleteArchivedFaculty);  // Permanently delete archived faculty by ID

router.get('/test', (req, res) => {
    console.log("✅ Test route working!");
    res.json({ message: 'Test route working!' });
});

module.exports = router;
