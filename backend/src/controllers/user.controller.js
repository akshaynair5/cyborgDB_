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

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(401, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Incorrect password");
  }

  const { refreshToken, accessToken } =
    await generateAccessAndRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id)
    .select("-password -refreshToken");

  return res.status(200).json(
    new ApiResponse(200, {
      user: loggedInUser,
      accessToken,
      refreshToken
    })
  );
});


export const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });

    return res.status(200).json(new ApiResponse(200, { message: "Logged out" }));
});


export const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find({ hospital: req.user.hospital });
    return res.status(200).json(new ApiResponse(200, { users }));
});

export const getUsersByRoles = asyncHandler(async (req, res) => {
    const rolesQuery = req.query.roles || '';
    const roles = Array.isArray(rolesQuery) ? rolesQuery : String(rolesQuery).split(',').map(r => r.trim()).filter(Boolean);
    if (!roles || roles.length === 0) {
        throw new ApiError(400, 'roles query parameter is required, e.g. ?roles=doctor,nurse');
    }

    const users = await User.find({ hospital: req.user.hospital, role: { $in: roles } }).select('-password -refreshToken');
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