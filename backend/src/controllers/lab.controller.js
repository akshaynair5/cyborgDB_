import { LabResult } from "../models/labResult.model.js";
import { Patient } from "../models/patient.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const createLabResult = asyncHandler(async (req, res) => {
const data = req.body;
data.hospital = req.user.hospital;
data.orderedBy = req.user._id;


const patient = await Patient.findById(data.patient);
if (!patient) throw new ApiError(404, "Patient not found");


const lab = await LabResult.create(data);


return res.status(201).json(new ApiResponse(201, { lab }));
});


export const getLabResults = asyncHandler(async (req, res) => {
const labs = await LabResult.find({ hospital: req.user.hospital }).populate({path: 'patient', select: 'firstName lastName'}).sort({ createdAt: -1 });
return res.status(200).json(new ApiResponse(200, { labs }));
});


export const getLabResultById = asyncHandler(async (req, res) => {
const lab = await LabResult.findById(req.params.id);
if (!lab) throw new ApiError(404, "Lab result not found");


return res.status(200).json(new ApiResponse(200, { lab }));
});


export const getLabResultsForEncounter = asyncHandler(async (req, res) => {
const encounterId = req.params.encounterId;
const labs = await LabResult.find({ hospital: req.user.hospital, encounter: encounterId })
    .populate('orderedBy', 'firstName lastName')
    .sort({ createdAt: -1 });
return res.status(200).json(new ApiResponse(200, { labs }));
});


export const updateLabResult = asyncHandler(async (req, res) => {
const updates = req.body;
const lab = await LabResult.findByIdAndUpdate(req.params.id, updates, { new: true });


if (!lab) throw new ApiError(404, "Lab result not found");


return res.status(200).json(new ApiResponse(200, { lab }));
});


export const deleteLabResult = asyncHandler(async (req, res) => {
const lab = await LabResult.findByIdAndDelete(req.params.id);
if (!lab) throw new ApiError(404, "Lab result not found");


return res.status(200).json(new ApiResponse(200, { message: "Lab result deleted" }));
});