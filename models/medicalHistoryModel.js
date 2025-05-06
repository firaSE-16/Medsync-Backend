const MedicalHistorySchema = new Schema({
    patientId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
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