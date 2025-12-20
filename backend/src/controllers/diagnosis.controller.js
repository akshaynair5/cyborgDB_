import { Diagnosis } from "../models/diagnosis.model.js";
import { Patient } from "../models/patient.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";


export const createDiagnosis = asyncHandler(async (req, res) => {
const data = req.body;
data.hospital = req.user.hospital;
data.recordedBy = req.user._id;


const patient = await Patient.findById(data.patient);
if (!patient) throw new ApiError(404, "Patient not found");


const diagnosis = await Diagnosis.create(data);

const populated = await Diagnosis.findById(diagnosis._id)
    .populate('patient', 'firstName lastName hospitalId')
    .populate('recordedBy', 'firstName lastName')
    .lean();

return res.status(201).json(new ApiResponse(201, { diagnosis: populated }));
});


export const getDiagnoses = asyncHandler(async (req, res) => {
const diagnoses = await Diagnosis.find({ hospital: req.user.hospital });
return res.status(200).json(new ApiResponse(200, { diagnoses }));
});


export const getDiagnosisById = asyncHandler(async (req, res) => {
const diagnosis = await Diagnosis.findById(req.params.id);
if (!diagnosis) throw new ApiError(404, "Diagnosis not found");


return res.status(200).json(new ApiResponse(200, { diagnosis }));
});


export const getDiagnosesForEncounter = asyncHandler(async (req, res) => {
const encounterId = req.params.encounterId;
const diagnoses = await Diagnosis.find({ hospital: req.user.hospital, encounter: encounterId })
    .populate('recordedBy', 'firstName lastName')
    .sort({ recordedAt: -1 });
return res.status(200).json(new ApiResponse(200, { diagnoses }));
});


export const updateDiagnosis = asyncHandler(async (req, res) => {
const updates = req.body;
const diagnosis = await Diagnosis.findByIdAndUpdate(req.params.id, updates, { new: true });


if (!diagnosis) throw new ApiError(404, "Diagnosis not found");


return res.status(200).json(new ApiResponse(200, { diagnosis }));
});


export const deleteDiagnosis = asyncHandler(async (req, res) => {
const diagnosis = await Diagnosis.findByIdAndDelete(req.params.id);
if (!diagnosis) throw new ApiError(404, "Diagnosis not found");


return res.status(200).json(new ApiResponse(200, { message: "Diagnosis deleted" }));
});