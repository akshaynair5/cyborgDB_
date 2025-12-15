import { ImagingReport } from "../models/imagingReport.model.js";
import { Patient } from "../models/patient.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Encounter } from "../models/encounter.model.js";


export const createImagingReport = asyncHandler(async (req, res) => {
  const data = req.body;
  data.hospital = req.user.hospital;

  const patient = await Patient.findById(data.patient);
  if (!patient) throw new ApiError(404, "Patient not found");

  if (!data.encounter) {
    throw new ApiError(400, "Encounter ID is required for imaging report");
  }

  const imaging = await ImagingReport.create(data);

  // 🔥 LINK IMAGING TO ENCOUNTER
  await Encounter.findByIdAndUpdate(
    data.encounter,
    { $push: { imaging: imaging._id } }
  );

  return res.status(201).json(new ApiResponse(201, { imaging }));
});


export const getImagingReports = asyncHandler(async (req, res) => {
    const imaging = await ImagingReport.find({ hospital: req.user.hospital });
    return res.status(200).json(new ApiResponse(200, { imaging }));
});


export const getImagingReportById = asyncHandler(async (req, res) => {
    const imaging = await ImagingReport.findById(req.params.id);
    if (!imaging) throw new ApiError(404, "Imaging report not found");


    return res.status(200).json(new ApiResponse(200, { imaging }));
});


export const getImagingReportsForEncounter = asyncHandler(async (req, res) => {
    const encounterId = req.params.encounterId;
    const imaging = await ImagingReport.find({ hospital: req.user.hospital, encounter: encounterId }).sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, { imaging }));
});


export const updateImagingReport = asyncHandler(async (req, res) => {
    const updates = req.body;
    const imaging = await ImagingReport.findByIdAndUpdate(req.params.id, updates, { new: true });


    if (!imaging) throw new ApiError(404, "Imaging report not found");


    return res.status(200).json(new ApiResponse(200, { imaging }));
});


export const deleteImagingReport = asyncHandler(async (req, res) => {
    const imaging = await ImagingReport.findByIdAndDelete(req.params.id);
    if (!imaging) throw new ApiError(404, "Imaging report not found");


    return res.status(200).json(new ApiResponse(200, { message: "Imaging report deleted" }));
});