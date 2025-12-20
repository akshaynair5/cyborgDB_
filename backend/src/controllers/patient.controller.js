import { Patient } from "../models/patient.model.js";
import { Counter } from "../models/counter.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";


export const createPatient = asyncHandler(async (req, res) => {
const data = req.body;
data.hospital = req.user.hospital;

	// Ensure hospitalId (MRN) exists; if not generate a per-hospital sequential MRN
	if (!data.hospitalId) {
		const key = `patient_mrn_${String(req.user.hospital)}`;
		const ctr = await Counter.findByIdAndUpdate(
			key,
			{ $inc: { seq: 1 } },
			{ new: true, upsert: true, setDefaultsOnInsert: true }
		);
		const seq = ctr.seq || 1;
		// Format MRN: zero-padded 6 digits
		data.hospitalId = String(seq).padStart(6, '0');
	}

	const patient = await Patient.create(data);
	return res.status(201).json(new ApiResponse(201, { patient }));
});

export const suggestMrn = asyncHandler(async (req, res) => {
	const hospital = req.user?.hospital;
	if (!hospital) throw new ApiError(403, 'User hospital context required');
	const key = `patient_mrn_${String(hospital)}`;
	const doc = await Counter.findById(key).lean();
	const next = (doc && doc.seq) ? doc.seq + 1 : 1;
	const suggestion = String(next).padStart(6, '0');
	return res.status(200).json(new ApiResponse(200, { suggestion }));
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