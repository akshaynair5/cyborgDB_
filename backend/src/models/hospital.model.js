import mongoose from 'mongoose';


const hospitalSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    address: String,
    contact: String,
    encryptionKeyId: String,
    meta: mongoose.Schema.Types.Mixed
}, { timestamps: true });


export const Hospital = mongoose.model('Hospital', hospitalSchema);