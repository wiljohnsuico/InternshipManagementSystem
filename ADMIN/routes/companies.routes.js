const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companies.controller');

// Routes for Companies
router.get('/', companyController.getAllCompanies);
router.get('/:id', companyController.getCompanyById);
router.post('/', companyController.addCompany);
router.put('/:id', companyController.updateCompany);
router.delete('/:id', companyController.deleteCompany);

module.exports = router;

