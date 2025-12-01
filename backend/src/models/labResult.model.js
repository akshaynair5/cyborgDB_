import mongoose from 'mongoose';


const singleLabSchema = new mongoose.Schema({
    testName: { type: String, required: true },
    value: String,
    units: String,
    referenceRange: String,
    flagged: { type: Boolean, default: false }
}, { _id: false });


const labResultSchema = new mongoose.Schema({
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    orderedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    encounter: { type: mongoose.Schema.Types.ObjectId, ref: 'Encounter' },
    collectedAt: Date,
    reportedAt: Date,
    tests: [singleLabSchema],
    status: { type: String, enum: ['ordered','collected','reported','cancelled'], default: 'ordered' },
    meta: mongoose.Schema.Types.Mixed
}, { timestamps: true });


labResultSchema.index({ patient:1, reportedAt:-1 });


export const LabResult = mongoose.model('LabResult', labResultSchema);