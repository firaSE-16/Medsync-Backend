const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminContoller');
const { authenticate, authorize } = require('../middlewares/authMiddlewares');



router.post('/register', adminController.registerAdmin);

// Register new staff (admin, doctor, triage)
router.post(
  '/staff',
  authenticate,
  authorize('admin'),
  adminController.registerStaff
);

// Get staff by category
router.get(
  '/staff/:role',
  authenticate,
  authorize('admin'),
  adminController.getStaffByCategory
);

// Get dashboard statistics
router.get(
  '/dashboard-stats',
  authenticate,
  authorize('admin'),
  adminController.getDashboardStats
);

// Get appointments by status
router.get(
  '/appointments',
  authenticate,
  authorize('admin'),
  adminController.getAppointmentsByStatus
);

// Get patients with filtering
router.get(
  '/patients',
  authenticate,
  authorize('admin'),
  adminController.getPatients
);

module.exports = router;