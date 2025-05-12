const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BookingSchema = new Schema({
    patientId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    patientName: {
        type: String,
        required: true
    },
    lookingFor: {
        type: String,
        required: true,
        enum: [
            'dermatologist',
            'pathologist',
            'cardiologist',
            'neurologist',
            'pediatrician',
            'psychiatrist',
            'general physician',
            'dentist',
            'ophthalmologist',
            'orthopedist'
        ]
    },
    priority: { 
        type: String, 
        enum: ['low', 'medium', 'high', 'emergency'], 
        default: 'medium' 
    },
    preferredDate: { 
        type: String, 
        required: true 
    },
    preferredTime: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['pending', 'assigned', 'cancelled', 'completed'], 
        default: 'pending' 
    },
    notes: { 
        type: String 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Update the updatedAt field before saving
BookingSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Booking', BookingSchema);