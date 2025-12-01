import { Encounter } from "../models/encounter.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const createEncounter = asyncHandler(async (req, res) => {
const data = req.body;
data.hospital = req.user.hospital;
data.doctor = req.user._id;


const patient = await Patient.findById(data.patient);
if (!patient) throw new ApiError(404, "Patient not found");


const encounter = await Encounter.create(data);


return res.status(201).json(new ApiResponse(201, { encounter }));
});


export const getEncounters = asyncHandler(async (req, res) => {
const encounters = await Encounter.find({ hospital: req.user.hospital });
return res.status(200).json(new ApiResponse(200, { encounters }));
});


export const getEncounterById = asyncHandler(async (req, res) => {
const encounter = await Encounter.findById(req.params.id);
if (!encounter) throw new ApiError(404, "Encounter not found");


return res.status(200).json(new ApiResponse(200, { encounter }));
});


export const updateEncounter = asyncHandler(async (req, res) => {
const updates = req.body;
const encounter = await Encounter.findByIdAndUpdate(req.params.id, updates, { new: true });


if (!encounter) throw new ApiError(404, "Encounter not found");


return res.status(200).json(new ApiResponse(200, { encounter }));
});


export const deleteEncounter = asyncHandler(async (req, res) => {
const encounter = await Encounter.findByIdAndDelete(req.params.id);
if (!encounter) throw new ApiError(404, "Encounter not found");


return res.status(200).json(new ApiResponse(200, { message: "Encounter deleted" }));
});