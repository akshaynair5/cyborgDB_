import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";


// Utility to generate tokens (similar format you provided)
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();


        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });


        return { accessToken, refreshToken };
    } catch (err) {
        throw new ApiError(500, "Token generation failed");
    }
};


export const registerUser = asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, role, hospital } = req.body;


    // Basic validation
    if (!email || !password || !firstName || !lastName) {
    throw new ApiError(400, "Missing required fields");
    }


    const existing = await User.findOne({ email });
    if (existing) throw new ApiError(409, "User already exists");


    const user = await User.create({ email, password, firstName, lastName, role, hospital });


    return res.status(201).json(new ApiResponse(201, { user }));
});


export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;


    const user = await User.findOne({ email }).select("+password");
    if (!user) throw new ApiError(404, "User not found");


    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new ApiError(401, "Invalid credentials");


    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);


    return res.status(200).json(new ApiResponse(200, { accessToken, refreshToken, user }));
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