const express = require('express');
const router = express.Router();
const triageController = require('../controllers/triageController');
const { authenticate, authorize } = require('../middlewares/authMiddlewares');

// Get unassigned bookings
router.get(
  '/bookings',
  authenticate,
  authorize('triage'),
  triageController.getUnassignedBookings
);

// Get available doctors
router.get(
  '/doctors',
  authenticate,
  authorize('triage'),
  triageController.getAvailableDoctors
);

// Process triage and assign doctor
router.post(
  '/process/:bookingId',
  authenticate,
  authorize('triage'),
  triageController.processTriage
);

// Update medical history
router.put(
  '/medical-history/:patientId',
  authenticate,
  authorize('triage'),
  triageController.updateMedicalHistory
);

module.exports = router;