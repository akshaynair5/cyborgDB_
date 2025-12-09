import { Admission } from "../models/admission.model.js";
import { Patient } from "../models/patient.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


// ---------------------------- CREATE ----------------------------
export const createAdmission = asyncHandler(async (req, res) => {
    const data = req.body;

    data.hospital = req.user.hospital;
    data.admittedBy = req.user._id;

    const patient = await Patient.findOne({
        _id: data.patient,
        hospital: req.user.hospital,
    });

    if (!patient) throw new ApiError(404, "Patient not found");

    const admission = await Admission.create(data);

    return res
        .status(201)
        .json(new ApiResponse(201, { admission }, "Admission created"));
});


// ---------------------------- LIST ----------------------------
export const getAdmissions = asyncHandler(async (req, res) => {
    const { status = "all", search = "", page = 1, limit = 20 } = req.query;

    const filter = { hospital: req.user.hospital };

    if (status !== "all") filter.status = status;

    const admissions = await Admission.find(filter)
        .populate("patient", "firstName lastName hospitalId")
        .sort({ admittedAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));

    const formatted = admissions.map(a => ({
        _id: a._id,
        patientName: `${a.patient.firstName} ${a.patient.lastName}`,
        hospitalId: a.patient.hospitalId,
        admittedAt: a.admittedAt,
        ward: a.ward,
        room: a.room,
        status: a.status,
    }));

    return res
        .status(200)
        .json(new ApiResponse(200, { admissions: formatted }));
});


// ---------------------------- GET ONE ----------------------------
export const getAdmissionById = asyncHandler(async (req, res) => {
    const admission = await Admission.findOne({
        _id: req.params.id,
        hospital: req.user.hospital,
    })
        .populate("patient", "firstName lastName gender dob phone address")
        .populate("admittedBy", "firstName lastName")
        .populate("primaryConsultant", "firstName lastName");

    if (!admission) throw new ApiError(404, "Admission not found");

    return res.status(200).json(new ApiResponse(200, { admission }));
});


// ---------------------------- UPDATE ----------------------------
export const updateAdmission = asyncHandler(async (req, res) => {
    const updates = req.body;

    const admission = await Admission.findOne({
        _id: req.params.id,
        hospital: req.user.hospital,
    });

    if (!admission) throw new ApiError(404, "Admission not found");

    if (admission.status === "discharged")
        throw new ApiError(400, "Cannot update a discharged admission");

    Object.assign(admission, updates);

    await admission.save();

    return res.status(200).json(new ApiResponse(200, { admission }));
});


// ---------------------------- DISCHARGE ----------------------------
export const dischargePatient = asyncHandler(async (req, res) => {
    const admission = await Admission.findOne({
        _id: req.params.id,
        hospital: req.user.hospital,
    });

    if (!admission) throw new ApiError(404, "Admission not found");

    if (admission.status === "discharged")
        throw new ApiError(400, "Patient already discharged");

    admission.dischargeAt = new Date();
    admission.dischargeSummary = req.body.dischargeSummary || "";
    admission.dischargeBy = req.user._id;
    admission.status = "discharged";

    await admission.save();

    return res
        .status(200)
        .json(new ApiResponse(200, { admission }, "Patient discharged"));
});


// ---------------------------- DELETE ----------------------------
export const deleteAdmission = asyncHandler(async (req, res) => {
    const admission = await Admission.findOneAndDelete({
        _id: req.params.id,
        hospital: req.user.hospital,
    });

    if (!admission) throw new ApiError(404, "Admission not found");

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Admission deleted"));
});