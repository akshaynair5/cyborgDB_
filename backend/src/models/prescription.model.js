import mongoose from 'mongoose';


const prescriptionItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    dosage: String,
    frequency: String,
    durationDays: Number,
    instructions: String,
    quantity: Number
}, { _id: false });


const prescriptionSchema = new mongoose.Schema({
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    prescribedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    encounter: { type: mongoose.Schema.Types.ObjectId, ref: 'Encounter' },
    items: [prescriptionItemSchema],
    notes: String,
    createdAt: { type: Date, default: Date.now }
});


prescriptionSchema.index({ patient:1, createdAt:-1 });


export const Prescription = mongoose.model('Prescription', prescriptionSchema);