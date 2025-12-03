import { Hospital } from "../models/hospital.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const createHospital = asyncHandler(async (req, res) => {
    const data = req.body;

    const hospital = await Hospital.create(data);
    return res.status(201).json(new ApiResponse(201, { hospital }));
});


export const getHospitals = asyncHandler(async (req, res) => {
const hospitals = await Hospital.find();
return res.status(200).json(new ApiResponse(200, { hospitals }));
});


export const getHospitalById = asyncHandler(async (req, res) => {
const hospital = await Hospital.findById(req.params.id);
if (!hospital) throw new ApiError(404, "Hospital not found");


return res.status(200).json(new ApiResponse(200, { hospital }));
});


export const updateHospital = asyncHandler(async (req, res) => {
const updates = req.body;
const hospital = await Hospital.findByIdAndUpdate(req.params.id, updates, { new: true });


if (!hospital) throw new ApiError(404, "Hospital not found");


return res.status(200).json(new ApiResponse(200, { hospital }));
});


export const deleteHospital = asyncHandler(async (req, res) => {
const hospital = await Hospital.findByIdAndDelete(req.params.id);
if (!hospital) throw new ApiError(404, "Hospital not found");


return res.status(200).json(new ApiResponse(200, { message: "Hospital deleted" }));
});