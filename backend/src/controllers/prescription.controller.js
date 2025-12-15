import { Prescription } from "../models/prescription.model.js";
import { Patient } from "../models/patient.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const createPrescription = asyncHandler(async (req, res) => {
    const data = req.body;
    data.hospital = req.user.hospital;
    data.prescribedBy = req.user._id;

    const patient = await Patient.findById(data.patient);
    if (!patient) throw new ApiError(404, "Patient not found");

    const prescription = await Prescription.create(data);

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

export const getPrescriptions = asyncHandler(async (req, res) => {
    const prescriptions = await Prescription.find({ hospital: req.user.hospital }).populate({path: 'patient', select: 'firstName lastName'}).populate('prescribedBy', 'firstName lastName').sort({ createdAt: -1 });
    console.log("Prescriptions fetched:", prescriptions.length);
    return res.status(200).json(new ApiResponse(200, { prescriptions }));
});


export const getPrescriptionsForPatient = asyncHandler(async (req, res) => {
    const patientId = req.params.id;
    const prescriptions = await Prescription.find({ hospital: req.user.hospital, patient: patientId }).sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, { prescriptions }));
});


export const getPrescriptionsForEncounter = asyncHandler(async (req, res) => {
    const encounterId = req.params.encounterId;
    console.log("Fetching prescriptions for encounter:", encounterId);
    const prescriptions = await Prescription.find({ hospital: req.user.hospital, encounter: encounterId })
        .populate('prescribedBy', 'firstName lastName')
        .populate('items')
        .sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, { prescriptions }));
});


export const getPrescriptionById = asyncHandler(async (req, res) => {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) throw new ApiError(404, "Prescription not found");


    return res.status(200).json(new ApiResponse(200, { prescription }));
});


export const updatePrescription = asyncHandler(async (req, res) => {
    const updates = req.body;
    const prescription = await Prescription.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true }
    );


    if (!prescription) throw new ApiError(404, "Prescription not found");


    return res.status(200).json(new ApiResponse(200, { prescription }));
});


export const deletePrescription = asyncHandler(async (req, res) => {
    const prescription = await Prescription.findByIdAndDelete(req.params.id);
    if (!prescription) throw new ApiError(404, "Prescription not found");


    return res.status(200).json(new ApiResponse(200, { message: "Prescription deleted" }));
});