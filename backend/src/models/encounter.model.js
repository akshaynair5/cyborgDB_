import mongoose from 'mongoose';


const vitalsSchema = new mongoose.Schema({
    temperatureC: Number,
    pulse: Number,
    respiratoryRate: Number,
    systolicBP: Number,
    diastolicBP: Number,
    spo2: Number,
    weightKg: Number,
    heightCm: Number
}, { _id: false });


const encounterSchema = new mongoose.Schema({
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    encounterType: { type: String, enum: ['outpatient','inpatient','emergency','teleconsult'], default: 'outpatient' },
    seenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    startedAt: { type: Date, default: Date.now },
    endedAt: Date,
    chiefComplaint: String,
    historyOfPresentIllness: String,
    examination: String,
    vitals: vitalsSchema,
    diagnoses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Diagnosis' }],
    prescriptions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' }],
    labs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'LabResult' }],
    imaging: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ImagingReport' }],
    notes: String,
    meta: mongoose.Schema.Types.Mixed
}, { timestamps: true });


encounterSchema.index({ patient:1, startedAt:-1 });


export const Encounter = mongoose.model('Encounter', encounterSchema);