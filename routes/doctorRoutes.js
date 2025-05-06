const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authenticate, authorize } = require('../middlewares/authMiddlewares');

// Get doctor's appointments
router.get(
  '/appointments',
  authenticate,
  authorize('doctor'),
  doctorController.getDoctorAppointments
);

// Get patient details with medical history
router.get(
  '/patients/:id',
  authenticate,
  authorize('doctor'),
  doctorController.getPatientDetails
);

// Add medical record
router.post(
  '/medical-records',
  authenticate,
  authorize('doctor'),
  doctorController.addMedicalRecord
);

// Add prescription
router.post(
  '/prescriptions',
  authenticate,
  authorize('doctor'),
  doctorController.addPrescription
);

// Update appointment status
router.put(
  '/appointments/:id/status',
  authenticate,
  authorize('doctor'),
  doctorController.updateAppointmentStatus
);

module.exports = router;