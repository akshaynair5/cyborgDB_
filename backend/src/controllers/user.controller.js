import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

// Utility to generate tokens (similar format you provided)
const generateAccessAndRefreshTokens = async (userId) =>{
    try{
        const user = await User.findById(userId) 
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})                
        
        return {refreshToken, accessToken}        
    }
    catch(err){
        throw new ApiError(500,"Something went wrong during token generation")
    }
}

export const registerUser = asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, role, hospital } = req.body;

    // Convert hospital string to ObjectId only if it exists and is non-empty
    const hospitalId = hospital ? new mongoose.Types.ObjectId(hospital) : undefined;

    if (!email || !password || !firstName || !lastName || !role) {
        throw new ApiError(400, "Missing required fields");
    }

    const existing = await User.findOne({ email });
    if (existing) throw new ApiError(409, "User already exists");

    const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        role,
        hospital: hospitalId,   // store as ObjectId
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong during user registration");
    }

    return res.status(201).json(new ApiResponse(200, createdUser, "User registered successfully"));
});

export const loginUser = asyncHandler(async (req,res)=>{

    const {email,username,password} = req.body

    if(!username && !email){
        throw new ApiError(400,"Username or email is required")
    }

    const userExists = await User.findOne({
        $or: [{username},{email}]
    })

    if(!userExists){
        throw new ApiError(401,"username or email does not exist")
    }

    const isPasswordValid = await userExists.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401,"Incorrect password")
    }   

    const {refreshToken,accessToken} = await generateAccessAndRefreshTokens(userExists._id)

    const loggedInUser = await User.findById(userExists._id).select(
        "-password -refreshToken"
    )

    const options = {
        httpOnly: true,               
        secure: true
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(200,{
        user: loggedInUser,
    }))
});

export const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });

    return res.status(200).json(new ApiResponse(200, { message: "Logged out" }));
});


export const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find({ hospital: req.user.hospital });
    return res.status(200).json(new ApiResponse(200, { users }));
});


export const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError(404, "User not found");

    return res.status(200).json(new ApiResponse(200, { user }));
});

export const updateUser = asyncHandler(async (req, res) => {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!user) throw new ApiError(404, "User not found");

    return res.status(200).json(new ApiResponse(200, { user }));
});

export const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) throw new ApiError(404, "User not found");

    return res.status(200).json(new ApiResponse(200, { message: "User deleted" }));
});