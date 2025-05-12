const User = require('../models/userModel');
const Appointment = require('../models/appointmentModel');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');

// @desc    Register new staff (admin, doctor, triage)
// @route   POST /api/admin/staff
// @access  Private/Admin
exports.registerStaff = asyncHandler(async (req, res) => {
  const { name, email, password, role, ...otherData } = req.body;

  // Validate role
  if (!['admin', 'doctor', 'triage'].includes(role)) {
    return res.status(400).json({ message: 'Invalid staff role' });
  }

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create staff user
  const staff = new User({
    name,
    email,
    password: hashedPassword,
    role,
    ...otherData
  });

  await staff.save();

  // Return user data without password
  const userData = staff.toObject();
  delete userData.password;

  res.status(201).json({
    success: true,
    data: userData
  });
});


exports.registerAdmin = asyncHandler(async (req, res) => {
  try {
    const { name, email, password, role, ...otherData } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const staff = new User({
      name,
      email,
      password: hashedPassword,
      role,
      ...otherData
    });

    await staff.save();
    const userData = staff.toObject();
    delete userData.password;

    res.status(201).json({ success: true, data: userData });
  } catch (error) {
    console.error('Error in registerAdmin:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});  

// @desc    Get all staff by category
// @route   GET /api/admin/staff/:role
// @access  Private/Admin
exports.getStaffByCategory = asyncHandler(async (req, res) => {
  const { role } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Validate role
  if (!['admin', 'doctor', 'triage'].includes(role)) {
    return res.status(400).json({ message: 'Invalid staff category' });
  }

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const total = await User.countDocuments({ role });
  const staff = await User.find({ role })
    .select('-password')
    .skip(startIndex)
    .limit(limit);

  // Pagination result
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
    count: staff.length,
    pagination,
    data: staff
  });
});

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard-stats
// @access  Private/Admin
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const [
    patients,
    doctors,
    triageStaff,
    appointments,
    upcomingAppointments,
    completedAppointments,
    cancelledAppointments
  ] = await Promise.all([
    User.countDocuments({ role: 'patient' }),
    User.countDocuments({ role: 'doctor' }),
    User.countDocuments({ role: 'triage' }),
    Appointment.countDocuments(),
    Appointment.countDocuments({ status: 'scheduled' }),
    Appointment.countDocuments({ status: 'completed' }),
    Appointment.countDocuments({ status: 'cancelled' })
  ]);

  res.status(200).json({
    success: true,
    data: {
      patients,
      doctors,
      triageStaff,
      appointments,
      upcomingAppointments,
      completedAppointments,
      cancelledAppointments
    }
  });
});

// @desc    Get appointments by status
// @route   GET /api/admin/appointments
// @access  Private/Admin
exports.getAppointmentsByStatus = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  // Validate status
  const validStatuses = ['scheduled', 'completed', 'cancelled', 'no-show'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid appointment status' });
  }

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const query = status ? { status } : {};
  const total = await Appointment.countDocuments(query);

  const appointments = await Appointment.find(query)
    .populate('patientId', 'name email')
    .populate('doctorId', 'name specialization')
    .sort({ date: 1 })
    .skip(startIndex)
    .limit(limit);

  // Pagination result
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
    count: appointments.length,
    pagination,
    data: appointments
  });
});

// @desc    Get patients with filtering
// @route   GET /api/admin/patients
// @access  Private/Admin
exports.getPatients = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  // Build query
  const query = { role: 'patient' };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const total = await User.countDocuments(query);
  const patients = await User.find(query)
    .select('-password')
    .skip(startIndex)
    .limit(limit);

  // Pagination result
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
    count: patients.length,
    pagination,
    data: patients
  });
});