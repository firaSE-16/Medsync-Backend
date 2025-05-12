const MedicalHistory = require('../models/medicalHistoryModel');
const Prescription = require('../models/prescriptionModel');
const Appointment = require('../models/appointmentModel');

const User = require('../models/userModel');
const asyncHandler = require('express-async-handler');

// @desc    Get doctor's appointments
// @route   GET /api/doctor/appointments
// @access  Private/Doctor
exports.getDoctorAppointments = asyncHandler(async (req, res) => {
  const { status, date } = req.query;
  const doctorId = req.user.id;

  // Build query
  const query = { doctorId };
  if (status) query.status = status;
  if (date) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    query.date = { $gte: startDate, $lte: endDate };
  }

  const appointments = await Appointment.find(query)
    .populate('patientId', 'name email dateOfBirth gender bloodGroup')
    .sort({ date: 1, time: 1 });

  res.status(200).json({
    success: true,
    count: appointments.length,
    data: appointments
  });
});

// @desc    Get patient details with medical history
// @route   GET /api/doctor/patients/:id
// @access  Private/Doctor
exports.getPatientDetails = asyncHandler(async (req, res) => {
  const patientId = req.params.id;
  const doctorId = req.user.id;

  // Verify the doctor has/had appointments with this patient
  const hasAppointments = await Appointment.exists({
    patientId,
    doctorId,
    status: { $in: ['scheduled', 'completed'] }
  });

  if (!hasAppointments) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this patient'
    });
  }

  const [patient, medicalHistory, prescriptions] = await Promise.all([
    User.findById(patientId).select('-password'),
    MedicalHistory.findOne({ patientId }),
    Prescription.find({ patientId }).sort({ date: -1 })
  ]);

  res.status(200).json({
    success: true,
    data: {
      patient,
      medicalHistory: medicalHistory || {},
      prescriptions
    }
  });
});


// @desc    Add prescription for patient
// @route   POST /api/doctor/prescriptions
// @access  Private/Doctor
exports.addPrescription = asyncHandler(async (req, res) => {
  const { patientId, appointmentId, medications, diagnosis, notes } = req.body;
  const doctorId = req.user.id;

  // Verify doctor has current appointment with patient
  const appointment = await Appointment.findOne({
    _id: appointmentId,
    patientId,
    doctorId,
    status: 'scheduled'
  });

  if (!appointment) {
    return res.status(403).json({
      success: false,
      message: 'No active appointment with this patient'
    });
  }

  const prescription = new Prescription({
    appointmentId,
    patientId,
    doctorId,
    medications,
    diagnosis,
    notes
  });

  await prescription.save();

  res.status(201).json({
    success: true,
    data: prescription
  });
});

// @desc    Update appointment status
// @route   PUT /api/doctor/appointments/:id/status
// @access  Private/Doctor
exports.updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const appointmentId = req.params.id;
  const doctorId = req.user.id;

  // Validate status
  if (!['completed', 'cancelled', 'no-show'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status value'
    });
  }

  const appointment = await Appointment.findOneAndUpdate(
    { _id: appointmentId, doctorId },
    { status },
    { new: true }
  );

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }

  res.status(200).json({
    success: true,
    data: appointment
  });
});

// @desc    Get all patients assigned to a doctor
// @route   GET /api/doctor/patients
// @access  Private/Doctor
exports.getDoctorPatients = asyncHandler(async (req, res) => {
  const doctorId = req.user.id;

  // Find all appointments for the doctor and populate patient details
  const appointments = await Appointment.find({ doctorId })
    .populate('patientId', 'name email dateOfBirth gender bloodGroup')
    .sort({ date: 1 });

  // Extract unique patients from appointments
  const patients = appointments.map(appointment => ({
    ...appointment.patientId.toObject(),
    id: appointment.patientId._id
  }));

  res.status(200).json({
    success: true,
    count: patients.length,
    data: patients
  });
});

// @desc    Get all medical records for a specific patient
// @route   GET /api/doctor/patients/:patientId/medical-records
// @access  Private/Doctor
exports.getPatientMedicalRecords = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const doctorId = req.user.id;

  // Verify the doctor has/had appointments with this patient
  const hasAppointments = await Appointment.exists({
    patientId,
    doctorId,
    status: { $in: ['scheduled', 'completed'] }
  });

  if (!hasAppointments) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this patient\'s records'
    });
  }

  // Retrieve all records for this patient and doctor
  const medicalRecords = await MedicalHistory.find({ patientId, doctorId })
    .populate('doctorId', 'name specialization')
    .populate('patientId', 'name dateOfBirth gender');

  if (!medicalRecords || medicalRecords.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'No medical records found for this patient'
    });
  }

  res.status(200).json({
    success: true,
    data: medicalRecords
  });
});

// @desc    Get specific medical record details
// @route   GET /api/doctor/medical-records/:recordId
// @access  Private/Doctor
exports.getMedicalRecordDetails = asyncHandler(async (req, res) => {
  const { recordId } = req.params;
  const doctorId = req.user.id;

  const medicalRecord = await MedicalHistory.findOne({
    _id: recordId,
    doctorId
  })
    .populate('doctorId', 'name specialization')
    .populate('patientId', 'name dateOfBirth gender');

  if (!medicalRecord) {
    return res.status(404).json({
      success: false,
      message: 'Medical record not found or not authorized'
    });
  }

  res.status(200).json({
    success: true,
    data: medicalRecord
  });
});

// @desc    Create new medical record for patient
// @route   POST /api/doctor/medical-records
// @access  Private/Doctor
exports.createMedicalRecord = asyncHandler(async (req, res) => {
  const { patientId, treatment, notes,diagnosis } = req.body;
  const doctorId = req.user.id;
console.log('Creating medical record:', req.body);
  // Handle the typo in the schema: use "diagonosis" instead of "diagnosis"
  const medicalHistory = await MedicalHistory.create({
    patientId,
    doctorId,
    diagnosis,  // Matching the typo in the schema
    treatment,
    notes,
    lastUpdated: new Date()
  });
  console.log('Created medical history:', medicalHistory);

  res.status(201).json({
    success: true,
    data: medicalHistory
  });
});


// @desc    Update medical record
// @route   PUT /api/doctor/medical-records/:recordId
// @access  Private/Doctor
exports.updateMedicalRecord = asyncHandler(async (req, res) => {
  const { recordId } = req.params;
  const { diagnosis, treatment, notes } = req.body;

  console.log('Updating medical record:', recordId);

  const medicalHistory = await MedicalHistory.findById(recordId);

  if (!medicalHistory) {
    return res.status(404).json({
      success: false,
      message: 'Medical record not found'
    });
  }

  // Match the model's field "diagonosis" (with the typo)
  medicalHistory.diagonosis = diagnosis || medicalHistory.diagonosis;
  medicalHistory.treatment = treatment || medicalHistory.treatment;
  medicalHistory.notes = notes || medicalHistory.notes;
  medicalHistory.lastUpdated = new Date();

  await medicalHistory.save();

  res.status(200).json({
    success: true,
    data: medicalHistory
  });
});

// @desc    Delete medical record
// @route   DELETE /api/doctor/medical-records/:recordId
// @access  Private/Doctor
exports.deleteMedicalRecord = asyncHandler(async (req, res) => {
  const { recordId } = req.params;
  const doctorId = req.user.id;

  const medicalHistory = await MedicalHistory.findOneAndDelete({
    _id: recordId,
    doctorId: doctorId
  });

  if (!medicalHistory) {
    return res.status(404).json({
      success: false,
      message: 'Medical record not found or not authorized'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Medical record deleted successfully',
    data: {
      patientId: medicalHistory.patientId
    }
  });
});
