const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MedicalHistorySchema = new Schema({
    patientId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    doctorId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    triageData: {
        vitals: {
          bloodPressure: String,
          heartRate: Number,
          temperature: Number,
          oxygenSaturation: Number,
          weight: Number,
          height: Number
        },
        triageId: {
          type: Schema.Types.ObjectId,
          ref: 'User'
        },
        triageDate: Date,
        priority: {
          type: String,
          enum: ['low', 'medium', 'high', 'emergency']
        },
        notes: String
    },
    allergies: [{ type: String }],
    chronicConditions: [{ type: String }],
    surgeries: [{
        name: { type: String },
        date: { type: Date },
        notes: { type: String }
    }],
    familyHistory: { type: String },
    immunizations: [{
        vaccine: { type: String },
        date: { type: Date },
        notes: { type: String }
    }],
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MedicalHistory', MedicalHistorySchema);