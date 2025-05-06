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

// @desc    Add medical record for patient
// @route   POST /api/doctor/medical-records
// @access  Private/Doctor
exports.addMedicalRecord = asyncHandler(async (req, res) => {
  const { patientId, diagnosis, treatment, notes } = req.body;
  const doctorId = req.user.id;

  // Verify doctor has current appointment with patient
  const currentAppointment = await Appointment.findOne({
    patientId,
    doctorId,
    status: 'scheduled'
  });

  if (!currentAppointment) {
    return res.status(403).json({
      success: false,
      message: 'No active appointment with this patient'
    });
  }

  // Update or create medical history
  const medicalHistory = await MedicalHistory.findOneAndUpdate(
    { patientId },
    {
      $push: {
        records: {
          date: new Date(),
          doctorId,
          diagnosis,
          treatment,
          notes
        }
      }
    },
    { new: true, upsert: true }
  );

  res.status(201).json({
    success: true,
    data: medicalHistory
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