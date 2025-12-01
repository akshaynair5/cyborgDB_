import mongoose from 'mongoose';


const imagingReportSchema = new mongoose.Schema({
hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
encounter: { type: mongoose.Schema.Types.ObjectId, ref: 'Encounter' },
modality: { type: String, enum: ['XRAY','USG','CT','MRI','ECG','OTHER'], default: 'OTHER' },
performedAt: Date,
reportedAt: Date,
report: String,
images: [{ url: String, caption: String }], 
meta: mongoose.Schema.Types.Mixed
}, { timestamps: true });


imagingReportSchema.index({ patient:1, reportedAt:-1 });


export const ImagingReport = mongoose.model('ImagingReport', imagingReportSchema);