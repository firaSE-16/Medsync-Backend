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
    diagnosis: { type: String },
    treatment: { type: String },
    notes: { type: String },
  
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MedicalHistory', MedicalHistorySchema);