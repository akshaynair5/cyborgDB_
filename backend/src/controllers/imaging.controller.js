import { ImagingReport } from "../models/imagingReport.model.js";
import { Patient } from "../models/patient.model.js";
import { Encounter } from "../models/encounter.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/* =========================================================
   CREATE IMAGING REPORT
   ========================================================= */
export const createImagingReport = asyncHandler(async (req, res) => {
  const data = req.body;
  data.hospital = req.user.hospital;

  const patient = await Patient.findById(data.patient);
  if (!patient) {
    throw new ApiError(404, "Patient not found");
  }

  // if (!data.encounter) {
  //   throw new ApiError(400, "Encounter ID is required for imaging report");
  // }

  const imaging = await ImagingReport.create(data);

  // 🔗 Link imaging to encounter
  await Encounter.findByIdAndUpdate(
    data.encounter,
    { $push: { imaging: imaging._id } }
  );

  return res.status(201).json(
    new ApiResponse(201, { imaging })
  );
});

/* =========================================================
   GET ALL IMAGING REPORTS (FOR LIST PAGE)
   👉 Used by ImagingList.jsx
   ========================================================= */
export const getImagingReports = asyncHandler(async (req, res) => {
  const imagingDocs = await ImagingReport.find({
    hospital: req.user.hospital
  })
    .populate("patient", "firstName lastName")
    .sort({ createdAt: -1 });

  // 🔥 Transform data for frontend table
  const imagingReports = imagingDocs.map((item) => ({
    _id: item._id,
    patientName: item.patient
      ? `${item.patient.firstName} ${item.patient.lastName}`
      : "Unknown",
    resultSummary: item.resultSummary || "N/A",
    createdAt: item.createdAt,
    modality: item.modality || "N/A",
    performedAt: item.performedAt || "N/A",
    report: item.report || "N/A",
    reportedAt: item.reportedAt || "N/A",
  }));

  return res.status(200).json(
    new ApiResponse(200, { imagingReports })
  );
});

/* =========================================================
   GET IMAGING REPORT BY ID
   👉 Used for View / Edit page
   ========================================================= */
export const getImagingReportById = asyncHandler(async (req, res) => {
  const imaging = await ImagingReport.findById(req.params.id)
    .populate("patient", "firstName lastName");

  if (!imaging) {
    throw new ApiError(404, "Imaging report not found");
  }

  return res.status(200).json(
    new ApiResponse(200, { imaging })
  );
});

/* =========================================================
   GET IMAGING REPORTS FOR A SPECIFIC ENCOUNTER
   👉 Used inside Encounter details page
   ========================================================= */
export const getImagingReportsForEncounter = asyncHandler(async (req, res) => {
  const encounterId = req.params.encounterId;

  const imaging = await ImagingReport.find({
    hospital: req.user.hospital,
    encounter: encounterId
  })
    .populate("patient", "firstName lastName")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, { imaging })
  );
});

/* =========================================================
   UPDATE IMAGING REPORT
   ========================================================= */
export const updateImagingReport = asyncHandler(async (req, res) => {
  const updates = req.body;

  const imaging = await ImagingReport.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true }
  );

  if (!imaging) {
    throw new ApiError(404, "Imaging report not found");
  }

  return res.status(200).json(
    new ApiResponse(200, { imaging })
  );
});

/* =========================================================
   DELETE IMAGING REPORT
   ========================================================= */
export const deleteImagingReport = asyncHandler(async (req, res) => {
  const imaging = await ImagingReport.findByIdAndDelete(req.params.id);

  if (!imaging) {
    throw new ApiError(404, "Imaging report not found");
  }

  return res.status(200).json(
    new ApiResponse(200, { message: "Imaging report deleted" })
  );
});
