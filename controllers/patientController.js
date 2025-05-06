
const Prescription = require('../models/prescriptionModel');
const MedicalHistory = require('../models/medicalHistoryModel');

const Appointment = require('../models/appointmentModel');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const asyncHandler = require('express-async-handler');

// @desc    Get all doctors assigned to patient
// @route   GET /api/patient/doctors
// @access  Private/Patient
exports.getPatientDoctors = asyncHandler(async (req, res) => {
  const patientId = req.user.id;

  const [medicalDoctors, appointmentDoctors] = await Promise.all([
    MedicalHistory.find({ patientId }).distinct('doctorId'),
    Appointment.find({ patientId }).distinct('doctorId')
  ]);

  const uniqueDoctorIds = [...new Set([...medicalDoctors, ...appointmentDoctors])];

  const doctors = await User.find({ 
    _id: { $in: uniqueDoctorIds },
    role: 'doctor'
  }).select('name specialization department profilePicture');

  res.status(200).json({
    success: true,
    count: doctors.length,
    data: doctors
  });
});

// @desc    Get patient's complete medical history
// @route   GET /api/patient/medical-history
// @access  Private/Patient
exports.getPatientMedicalHistory = asyncHandler(async (req, res) => {
  const patientId = req.user.id;

  const medicalHistory = await MedicalHistory.findOne({ patientId })
    .populate('doctorId', 'name specialization')
    .populate('triageData.triageId', 'name');

  if (!medicalHistory) {
    return res.status(404).json({
      success: false,
      message: 'No medical history found'
    });
  }

  res.status(200).json({
    success: true,
    data: medicalHistory
  });
});

// @desc    Get all patient prescriptions
// @route   GET /api/patient/prescriptions
// @access  Private/Patient
exports.getPatientPrescriptions = asyncHandler(async (req, res) => {
  const patientId = req.user.id;
  const { page = 1, limit = 10 } = req.query;
  const startIndex = (page - 1) * limit;

  const total = await Prescription.countDocuments({ patientId });
  const prescriptions = await Prescription.find({ patientId })
    .populate('doctorId', 'name specialization')
    .sort({ date: -1 })
    .skip(startIndex)
    .limit(limit);

  const pagination = {};
  if (endIndex < total) {
    pagination.next = {
      page: parseInt(page) + 1,
      limit: parseInt(limit)
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: parseInt(page) - 1,
      limit: parseInt(limit)
    };
  }

  res.status(200).json({
    success: true,
    count: prescriptions.length,
    pagination,
    data: prescriptions
  });
});

// @desc    Get patient bookings
// @route   GET /api/patient/bookings
// @access  Private/Patient
exports.getPatientBookings = asyncHandler(async (req, res) => {
  const patientId = req.user.id;
  const { status } = req.query;

  const query = { patientId };
  if (status) query.status = status;

  const bookings = await Booking.find(query)
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings
  });
});

// @desc    Create new booking
// @route   POST /api/patient/bookings
// @access  Private/Patient
exports.createBooking = asyncHandler(async (req, res) => {
  const patientId = req.user.id;
  const { symptoms, priority, preferredDate, preferredTime } = req.body;

  if (!symptoms) {
    return res.status(400).json({
      success: false,
      message: 'Symptoms description is required'
    });
  }

  const booking = new Booking({
    patientId,
    symptoms,
    priority: priority || 'medium',
    preferredDate,
    preferredTime,
    status: 'pending'
  });

  await booking.save();
  await booking.populate('patientId', 'name email');

  res.status(201).json({
    success: true,
    data: booking
  });
});

// @desc    Cancel booking
// @route   PUT /api/patient/bookings/:id/cancel
// @access  Private/Patient
exports.cancelBooking = asyncHandler(async (req, res) => {
  const bookingId = req.params.id;
  const patientId = req.user.id;

  const booking = await Booking.findOneAndUpdate(
    { _id: bookingId, patientId, status: 'pending' },
    { status: 'cancelled' },
    { new: true }
  );

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found or already processed'
    });
  }

  res.status(200).json({
    success: true,
    data: booking
  });
});

// @desc    Get patient appointments
// @route   GET /api/patient/appointments
// @access  Private/Patient
exports.getPatientAppointments = asyncHandler(async (req, res) => {
  const patientId = req.user.id;
  const { status, upcoming } = req.query;

  const query = { patientId };
  if (status) query.status = status;
  
  if (upcoming === 'true') {
    query.date = { $gte: new Date() };
    query.status = 'scheduled';
  }

  const appointments = await Appointment.find(query)
    .populate('doctorId', 'name specialization department profilePicture')
    .sort({ date: 1, time: 1 });

  res.status(200).json({
    success: true,
    count: appointments.length,
    data: appointments
  });
});

// @desc    Get patient dashboard data
// @route   GET /api/patient/dashboard
// @access  Private/Patient
exports.getPatientDashboard = asyncHandler(async (req, res) => {
  const patientId = req.user.id;

  const [
    upcomingAppointments,
    recentPrescriptions,
    pendingBookings,
    medicalHistory
  ] = await Promise.all([
    Appointment.find({ 
      patientId, 
      status: 'scheduled',
      date: { $gte: new Date() }
    })
    .sort({ date: 1 })
    .limit(3)
    .populate('doctorId', 'name specialization'),
    
    Prescription.find({ patientId })
      .sort({ date: -1 })
      .limit(3)
      .populate('doctorId', 'name'),

    Booking.find({ patientId, status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(3),
      
    MedicalHistory.findOne({ patientId })
      .select('allergies chronicConditions')
  ]);

  res.status(200).json({
    success: true,
    data: {
      upcomingAppointments,
      recentPrescriptions,
      pendingBookings,
      allergies: medicalHistory?.allergies || [],
      conditions: medicalHistory?.chronicConditions || []
    }
  });
});