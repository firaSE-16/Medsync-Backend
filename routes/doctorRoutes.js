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

// Get all patients assigned to a doctor
router.get(
  '/patients',
  authenticate,
  authorize('doctor'),
  doctorController.getDoctorPatients
);

// Get all medical records for a specific patient
router.get(
  '/patients/:patientId/medical-records',
  authenticate,
  authorize('doctor'),
  doctorController.getPatientMedicalRecords
);

// Get specific medical record details
router.get(
  '/medical-records/:recordId',
  authenticate,
  authorize('doctor'),
  doctorController.getMedicalRecordDetails
);

// Create new medical record for patient
router.post(
  '/medical-records',
  authenticate,
  authorize('doctor'),
  doctorController.createMedicalRecord
);

// Update medical record
router.put(
  '/medical-records/:recordId',
  authenticate,
  authorize('doctor'),
  doctorController.updateMedicalRecord
);

// Delete medical record
router.delete(
  '/medical-records/:recordId',
  authenticate,
  authorize('doctor'),
  doctorController.deleteMedicalRecord
);

module.exports = router;