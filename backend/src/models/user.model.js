import mongoose from 'mongoose';


const userSchema = new mongoose.Schema({
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String },
    role: {
    type: String,
    enum: ['doctor','nurse','admin','receptionist','lab_technician','pharmacist'],
    refreshToken: {type: String, required: false},
    accessToken: {type: String, required: false},
    required: true,
    },
    isActive: { type: Boolean, default: true },
    meta: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });


userSchema.index({ hospital: 1, email: 1 }, { unique: true });


export const User = mongoose.model('User', userSchema);