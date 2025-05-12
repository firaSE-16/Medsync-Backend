// package com.example.myapplication.data.model

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        required: true, 
        enum: ['patient', 'doctor', 'triage', 'admin'] 
    },
    about: { type: String },
    rating:{type:Number},
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    // Common fields for patients and doctors
    phoneNumber: { type: String },
    address: { type: String },
    profilePicture: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Additional patient-specific fields
UserSchema.add({
    bloodGroup: { type: String },
    emergencyContactName: { type: String },
    emergencyContactNumber: { type: String },
    doctorId: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    // Doctor-specific fields
    specialization: { type: String },
    phone: { type: String },
    rating: {type : Number},
    hospital:{type: String},
    experienceYears:{type : Number},
    qualifications: { type: String },
    licenseNumber: { type: String },
    department: { type: String },
    // Admin/triage specific fields
    position: { type: String }
});

module.exports = mongoose.model('User', UserSchema);