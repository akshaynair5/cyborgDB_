import { Patient } from "../models/patient.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const createPatient = asyncHandler(async (req, res) => {
const data = req.body;
data.hospital = req.user.hospital;


const patient = await Patient.create(data);
return res.status(201).json(new ApiResponse(201, { patient }));
});


export const getPatients = asyncHandler(async (req, res) => {
const patients = await Patient.find({ hospital: req.user.hospital });
return res.status(200).json(new ApiResponse(200, { patients }));
});


export const getPatientById = asyncHandler(async (req, res) => {
const patient = await Patient.findById(req.params.id);
if (!patient) throw new ApiError(404, "Patient not found");


return res.status(200).json(new ApiResponse(200, { patient }));
});


export const updatePatient = asyncHandler(async (req, res) => {
const updates = req.body;
const patient = await Patient.findByIdAndUpdate(req.params.id, updates, { new: true });


if (!patient) throw new ApiError(404, "Patient not found");


return res.status(200).json(new ApiResponse(200, { patient }));
});


export const deletePatient = asyncHandler(async (req, res) => {
const patient = await Patient.findByIdAndDelete(req.params.id);
if (!patient) throw new ApiError(404, "Patient not found");


return res.status(200).json(new ApiResponse(200, { message: "Patient deleted" }));
});