import mongoose from 'mongoose';


const diagnosisSchema = new mongoose.Schema({
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    encounter: { type: mongoose.Schema.Types.ObjectId, ref: 'Encounter' },
    code: String, // ICD-10 or local code
    description: { type: String, required: true },
    isPrimary: { type: Boolean, default: false },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recordedAt: { type: Date, default: Date.now },
    meta: mongoose.Schema.Types.Mixed
});


diagnosisSchema.index({ hospital:1, code:1 });
diagnosisSchema.index({ patient:1 });
diagnosisSchema.index({ encounter:1 });


export const Diagnosis = mongoose.model('Diagnosis', diagnosisSchema);