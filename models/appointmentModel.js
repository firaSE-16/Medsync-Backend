const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AppointmentSchema = new Schema({
    bookingId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Booking', 
        required: true 
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
    date: { type: Date, required: true },
    time: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['scheduled', 'completed', 'cancelled', 'no-show'], 
        default: 'scheduled' 
    },
    reason: { type: String }, // From booking symptoms
    notes: { type: String }, // Doctor/triage notes
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', AppointmentSchema);