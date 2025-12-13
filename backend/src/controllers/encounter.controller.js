import { Encounter } from "../models/encounter.model.js";
import { Patient } from "../models/patient.model.js";
import { Prescription } from "../models/prescription.model.js";
import { LabResult } from "../models/labResult.model.js";
import { ImagingReport } from "../models/imagingReport.model.js";
import { Diagnosis } from "../models/diagnosis.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import cyborgClient from "../utils/cyborg.client.js";


export const createEncounter = asyncHandler(async (req, res) => {
    const data = req.body;
    data.hospital = req.user.hospital;
    // model uses `seenBy`
    data.seenBy = req.user._id;

    const patient = await Patient.findById(data.patient);
    if (!patient) throw new ApiError(404, "Patient not found");

    const encounter = await Encounter.create(data);

    const populated = await Encounter.findById(encounter._id)
        .populate('patient')
        .populate('diagnoses')
        .populate('prescriptions')
        .populate('labs')
        .populate('imaging')
        .populate('seenBy', 'firstName lastName role')
        .lean();

    return res.status(201).json(new ApiResponse(201, { encounter: populated }));
});


export const getEncounters = asyncHandler(async (req, res) => {
    const encounters = await Encounter.find({ hospital: req.user.hospital })
        .sort({ startedAt: -1 })
        .limit(200)
        .populate('patient', 'firstName lastName hospitalId dob gender')
        .populate('seenBy', 'firstName lastName role')
        .populate('diagnoses')
        .lean();

    return res.status(200).json(new ApiResponse(200, { encounters }));
});


function redactForCrossHospital(encounterObj) {
    const e = JSON.parse(JSON.stringify(encounterObj));
    if (e.patient) {
        delete e.patient.firstName;
        delete e.patient.lastName;
        delete e.patient.hospitalId;
        delete e.patient.address;
        delete e.patient.phone;
        delete e.patient.emergencyContacts;
    }
    if (e.hospital) {
        if (typeof e.hospital === 'object') {
            delete e.hospital.name;
            delete e.hospital.address;
            delete e.hospital.contact;
        }
    }
    return e;
}


export const getEncounterById = asyncHandler(async (req, res) => {
    const encounter = await Encounter.findById(req.params.id)
        .populate('patient')
        .populate('diagnoses')
        .populate('prescriptions')
        .populate({ path: 'labs', populate: { path: 'orderedBy', select: 'firstName lastName' } })
        .populate('imaging')
        .populate('seenBy', 'firstName lastName role hospital')
        .lean();

    if (!encounter) throw new ApiError(404, "Encounter not found");

    const requesterHospital = String(req.user.hospital || '');
    const patientHospital = encounter.patient && encounter.patient.hospital ? String(encounter.patient.hospital) : null;

    if (!patientHospital || requesterHospital === patientHospital) {
        return res.status(200).json(new ApiResponse(200, { encounter }));
    }

    const redacted = redactForCrossHospital(encounter);
    return res.status(200).json(new ApiResponse(200, { encounter: redacted }));
});


export const updateEncounter = asyncHandler(async (req, res) => {
    const updates = req.body;

    const before = await Encounter.findById(req.params.id).lean();
    if (!before) throw new ApiError(404, "Encounter not found");

    const encounter = await Encounter.findByIdAndUpdate(req.params.id, updates, { new: true })
        .populate('patient')
        .populate('diagnoses')
        .populate('prescriptions')
        .populate('labs')
        .populate('imaging')
        .populate('seenBy', 'firstName lastName role hospital')
        .lean();

    const hadEnded = before.endedAt;
    const nowEnded = encounter.endedAt;
    if (!hadEnded && nowEnded) {
        // send populated encounter (full) to Cyborg microservice asynchronously
        cyborgClient.upsertEncounter(encounter).catch(() => {});
    }

    return res.status(200).json(new ApiResponse(200, { encounter }));
});


export const deleteEncounter = asyncHandler(async (req, res) => {
    const encounter = await Encounter.findByIdAndDelete(req.params.id);
    if (!encounter) throw new ApiError(404, "Encounter not found");

    return res.status(200).json(new ApiResponse(200, { message: "Encounter deleted" }));
});