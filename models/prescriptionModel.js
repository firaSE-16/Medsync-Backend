const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PrescriptionSchema = new Schema({
    appointmentId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Appointment', 
         
    },
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
    medications: [{
        image: { type: String },
        name: { type: String },
        dosage: { type: String },
        frequency: { type: String },
        description: { type: String },
        price: { type: Number },
    }],
    
    
});

module.exports = mongoose.model('Prescription', PrescriptionSchema);