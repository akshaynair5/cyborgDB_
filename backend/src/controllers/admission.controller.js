import { Admission } from "../models/admission.model.js";
import { Patient } from "../models/patient.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const createAdmission = asyncHandler(async (req, res) => {
    const data = req.body;
    data.hospital = req.user.hospital;
    data.admittedBy = req.user._id;


    const patient = await Patient.findById(data.patient);
    if (!patient) throw new ApiError(404, "Patient not found");


    const admission = await Admission.create(data);
    return res.status(201).json(new ApiResponse(201, { admission }));
});


export const getAdmissions = asyncHandler(async (req, res) => {
    const admissions = await Admission.find({ hospital: req.user.hospital });
    return res.status(200).json(new ApiResponse(200, { admissions }));
    });


    export const getAdmissionById = asyncHandler(async (req, res) => {
    const admission = await Admission.findById(req.params.id);
    if (!admission) throw new ApiError(404, "Admission not found");


    return res.status(200).json(new ApiResponse(200, { admission }));
});


export const updateAdmission = asyncHandler(async (req, res) => {
    const updates = req.body;
    const admission = await Admission.findByIdAndUpdate(req.params.id, updates, { new: true });


    if (!admission) throw new ApiError(404, "Admission not found");


    return res.status(200).json(new ApiResponse(200, { admission }));
});


export const dischargePatient = asyncHandler(async (req, res) => {
    const admission = await Admission.findById(req.params.id);
    if (!admission) throw new ApiError(404, "Admission not found");


    if (admission.dischargedAt) throw new ApiError(400, "Patient already discharged");


    admission.dischargedAt = new Date();
    admission.dischargeSummary = req.body.dischargeSummary || null;
    admission.dischargedBy = req.user._id;


    await admission.save();


    return res.status(200).json(new ApiResponse(200, { admission }));
    });


    export const deleteAdmission = asyncHandler(async (req, res) => {
    const admission = await Admission.findByIdAndDelete(req.params.id);
    if (!admission) throw new ApiError(404, "Admission not found");


    return res.status(200).json(new ApiResponse(200, { message: "Admission deleted" }));
});