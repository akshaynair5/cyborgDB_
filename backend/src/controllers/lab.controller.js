import { LabResult } from "../models/labResult.model.js";
import { Patient } from "../models/patient.model.js";
import { Encounter } from "../models/encounter.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

/* =========================================================
   CREATE LAB RESULT
   ========================================================= */
export const createLabResult = asyncHandler(async (req, res) => {
  const data = req.body;
  data.hospital = req.user.hospital;
  data.orderedBy = req.user._id;

  const patient = await Patient.findById(data.patient);
  if (!patient) {
    throw new ApiError(404, "Patient not found");
  }

  // if (!data.encounter) {
  //   throw new ApiError(400, "Encounter ID is required for lab result");
  // }

  const lab = await LabResult.create(data);

  // 🔗 Link lab to encounter
  await Encounter.findByIdAndUpdate(
    data.encounter,
    { $push: { labs: lab._id } }
  );

  return res.status(201).json(
    new ApiResponse(201, { lab })
  );
});

export const getLabResults = asyncHandler(async (req, res) => {
  const labs = await LabResult.find({
    hospital: req.user.hospital,
  })
    .populate("patient", "firstName lastName")
    .sort({ createdAt: -1 });

  const labResults = labs.map((lab) => ({
    _id: lab._id,

    patient: lab.patient
      ? {
          _id: lab.patient._id,
          firstName: lab.patient.firstName,
          lastName: lab.patient.lastName,
        }
      : null,

    status: lab.status || "reported",
    collectedAt: lab.collectedAt,
    reportedAt: lab.reportedAt,

    tests: lab.tests.map((test) => ({
      testName: test.testName,
      value: test.value,
      units: test.units,
      referenceRange: test.referenceRange,
      flagged: test.flagged,
      status: test.status,
    })),

    createdAt: lab.createdAt,
  }));

  return res.status(200).json(
    new ApiResponse(200, { labResults })
  );
});

/* =========================================================
   GET LAB RESULT BY ID
   👉 Used for View / Edit page
   ========================================================= */
export const getLabResultById = asyncHandler(async (req, res) => {
  const lab = await LabResult.findById(req.params.id)
    .populate("patient", "firstName lastName")
    .populate("orderedBy", "firstName lastName");

  if (!lab) {
    throw new ApiError(404, "Lab result not found");
  }

  return res.status(200).json(
    new ApiResponse(200, { lab })
  );
});

/* =========================================================
   GET LAB RESULTS FOR A SPECIFIC ENCOUNTER
   👉 Used inside Encounter details page
   ========================================================= */
export const getLabResultsForEncounter = asyncHandler(async (req, res) => {
  const encounterId = req.params.encounterId;

  const labs = await LabResult.find({
    hospital: req.user.hospital,
    encounter: encounterId
  })
    .populate("orderedBy", "firstName lastName")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, { labs })
  );
});

/* =========================================================
   UPDATE LAB RESULT
   ========================================================= */
export const updateLabResult = asyncHandler(async (req, res) => {
  const updates = req.body;

  const lab = await LabResult.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true }
  );

  if (!lab) {
    throw new ApiError(404, "Lab result not found");
  }

  return res.status(200).json(
    new ApiResponse(200, { lab })
  );
});

/* =========================================================
   DELETE LAB RESULT
   ========================================================= */
export const deleteLabResult = asyncHandler(async (req, res) => {
  const lab = await LabResult.findByIdAndDelete(req.params.id);

  if (!lab) {
    throw new ApiError(404, "Lab result not found");
  }

  return res.status(200).json(
    new ApiResponse(200, { message: "Lab result deleted" })
  );
});
