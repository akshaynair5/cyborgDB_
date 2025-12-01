import mongoose from 'mongoose';


const admissionSchema = new mongoose.Schema({
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    admittedAt: { type: Date, default: Date.now },
    admittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    admissionReason: String,
    ward: String,
    room: String,
    primaryConsultant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dischargeAt: Date,
    dischargeSummary: String,
    status: { type: String, enum: ['active','discharged','transferred'], default: 'active' },
    meta: mongoose.Schema.Types.Mixed
}, { timestamps: true });


admissionSchema.pre('save', function(next) {
    if (this.dischargeAt && this.dischargeAt < this.admittedAt) {
        return next(new Error('dischargeAt must be later than admittedAt'));
    }
    if (this.dischargeAt && this.status !== 'discharged') this.status = 'discharged';
    next();
});


admissionSchema.index({ patient:1, admittedAt:-1 });


export const Admission = mongoose.model('Admission', admissionSchema);