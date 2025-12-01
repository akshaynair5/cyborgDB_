import mongoose from 'mongoose';


const auditLogSchema = new mongoose.Schema({
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    targetModel: String,
    targetId: mongoose.Schema.Types.ObjectId,
    ip: String,
    meta: mongoose.Schema.Types.Mixed
}, { timestamps: true });


export const AuditLog = mongoose.model('AuditLog', auditLogSchema);