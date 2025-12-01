import mongoose from 'mongoose';


const emergencyContactSchema = new mongoose.Schema({
    name: String,
    relation: String,
    phone: String
}, { _id: false });

const patientSchema = new mongoose.Schema({
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    hospitalId: { type: String, required: true }, // MRN per hospital
    firstName: String,
    lastName: String,
    dob: Date,
    gender: { type: String, enum: ['male','female','other','unknown'], default: 'unknown' },
    phone: String,
    address: String,
    bloodGroup: String,
    allergies: [String],
    chronicConditions: [String],
    emergencyContacts: [emergencyContactSchema],
    meta: mongoose.Schema.Types.Mixed
}, { timestamps: true });


patientSchema.index({ hospital:1, hospitalId:1 }, { unique: true });


export const Patient = mongoose.model('Patient', patientSchema);