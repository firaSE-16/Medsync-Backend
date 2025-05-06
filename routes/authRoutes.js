const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Patient registration
router.post('/register/patient', authController.registerPatient);

// Login for all users
router.post('/login', authController.login);

module.exports = router;