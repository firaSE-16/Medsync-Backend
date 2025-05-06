const BookingSchema = new Schema({
    patientId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    symptoms: { type: String, required: true },
    priority: { 
        type: String, 
        enum: ['low', 'medium', 'high', 'emergency'], 
        default: 'medium' 
    },
    preferredDate: { type: Date },
    preferredTime: { type: String },
    status: { 
        type: String, 
        enum: ['pending', 'assigned', 'cancelled'], 
        default: 'pending' 
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    notes: { type: String } // For triage/admin notes
});

module.exports = mongoose.model('Booking', BookingSchema);