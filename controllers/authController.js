const User = require('../models/userModel');
const { generateToken } = require('../utils/generateToken');
const bcrypt = require('bcryptjs');

// Patient Registration
exports.registerPatient = async (req, res) => {
  try {
    const { name, email, password, dateOfBirth, gender, bloodGroup, 
            emergencyContactName, emergencyContactNumber } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create patient
    const patient = new User({
      name,
      email,
      password: hashedPassword,
      role: 'patient',
      dateOfBirth,
      gender,
      bloodGroup,
      emergencyContactName,
      emergencyContactNumber
    });

    await patient.save();

    // Generate token
    const token = generateToken(patient._id, patient.role);

    res.status(201).json({
      token,
      userId: patient._id,
      role: patient.role,
      name: patient.name,
      message: 'Patient registered successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login for all users
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      token,
      userId: user._id,
      role: user.role,
      name: user.name,
      message: 'Login successful'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};