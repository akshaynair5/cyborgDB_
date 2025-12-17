import { Prescription } from "../models/prescription.model.js";
import { Patient } from "../models/patient.model.js";
import { Encounter } from "../models/encounter.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/* =========================================================
   CREATE PRESCRIPTION
   ========================================================= */
export const createPrescription = asyncHandler(async (req, res) => {
  const data = req.body;
  data.hospital = req.user.hospital;
  data.prescribedBy = req.user._id;

  const patient = await Patient.findById(data.patient);
  if (!patient) {
    throw new ApiError(404, "Patient not found");
  }

  const prescription = await Prescription.create(data);

  // 🔗 Link prescription to encounter (if provided)
  if (data.encounter) {
    await Encounter.findByIdAndUpdate(
      data.encounter,
      { $addToSet: { prescriptions: prescription._id } }
    );
  }

  return res.status(201).json(
    new ApiResponse(201, { prescription })
  );
});

/* =========================================================
   GET ALL PRESCRIPTIONS (FOR LIST PAGE)
   👉 Used by PrescriptionList.jsx
   ========================================================= */
export const getPrescriptions = asyncHandler(async (req, res) => {
  const prescriptions = await Prescription.find({
    hospital: req.user.hospital
  })
    .populate("patient", "firstName lastName")
    .populate("items")
    .sort({ createdAt: -1 });

  // 🔥 Transform for frontend table
  const formatted = prescriptions.map((p) => ({
    _id: p._id,
    patientName: p.patient
      ? `${p.patient.firstName} ${p.patient.lastName}`
      : "Unknown",
    medication: p.items?.[0]?.medication || "-",
    dosage: p.items?.[0]?.dosage || "-",
    frequency: p.items?.[0]?.frequency || "-",
    createdAt: p.createdAt
  }));

  return res.status(200).json(
    new ApiResponse(200, { prescriptions: formatted })
  );
});

/* =========================================================
   GET PRESCRIPTIONS FOR A PATIENT
   ========================================================= */
export const getPrescriptionsForPatient = asyncHandler(async (req, res) => {
  const patientId = req.params.id;

  const prescriptions = await Prescription.find({
    hospital: req.user.hospital,
    patient: patientId
  })
    .populate("prescribedBy", "firstName lastName")
    .populate("items")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, { prescriptions })
  );
});

/* =========================================================
   GET PRESCRIPTIONS FOR AN ENCOUNTER
   👉 Used inside Encounter details page
   ========================================================= */
export const getPrescriptionsForEncounter = asyncHandler(async (req, res) => {
  const encounterId = req.params.encounterId;

  const prescriptions = await Prescription.find({
    hospital: req.user.hospital,
    encounter: encounterId
  })
    .populate("prescribedBy", "firstName lastName")
    .populate("items")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, { prescriptions })
  );
});

/* =========================================================
   GET PRESCRIPTION BY ID
   👉 Used for View / Edit page
   ========================================================= */
export const getPrescriptionById = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id)
    .populate("patient", "firstName lastName")
    .populate("prescribedBy", "firstName lastName")
    .populate("items");

  if (!prescription) {
    throw new ApiError(404, "Prescription not found");
  }

  return res.status(200).json(
    new ApiResponse(200, { prescription })
  );
});

/* =========================================================
   UPDATE PRESCRIPTION
   ========================================================= */
export const updatePrescription = asyncHandler(async (req, res) => {
  const updates = req.body;

  const prescription = await Prescription.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true }
  );

  if (!prescription) {
    throw new ApiError(404, "Prescription not found");
  }

  return res.status(200).json(
    new ApiResponse(200, { prescription })
  );
});

/* =========================================================
   DELETE PRESCRIPTION
   ========================================================= */
export const deletePrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findByIdAndDelete(req.params.id);

  if (!prescription) {
    throw new ApiError(404, "Prescription not found");
  }

  return res.status(200).json(
    new ApiResponse(200, { message: "Prescription deleted" })
  );
});
