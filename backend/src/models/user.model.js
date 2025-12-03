import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


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

userSchema.pre('save',async function(next){
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password,10) 
    next();
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign({
        _id:this._id,
        username:this.username,
        email:this.email,
        firstName:this.firstName,
    }, process.env.ACCESS_TOKEN_SECRET, {expiresIn: process.env.ACCESS_TOKEN_EXPIRY})
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id:this._id,     
    }, process.env.REFRESH_TOKEN_SECRET, {expiresIn: process.env.REFRESH_TOKEN_EXPIRY})
}

userSchema.index({ hospital: 1, email: 1 }, { unique: true });


export const User = mongoose.model('User', userSchema);
