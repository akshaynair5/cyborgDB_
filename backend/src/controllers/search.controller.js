import { Patient } from '../models/patient.model.js';
import { Encounter } from '../models/encounter.model.js';
import { LabResult } from '../models/labResult.model.js';
import { ImagingReport } from '../models/imagingReport.model.js';
import { Prescription } from '../models/prescription.model.js';
import { asyncHandler } from '../utils/AsyncHandler.js';
import ApiError from '../utils/ApiError.js';

// Simple local search across common collections scoped to req.user.hospital
export const localSearch = asyncHandler(async (req, res) => {
  const q = String(req.query.query || req.query.q || '').trim();
  if (!q) throw new ApiError(400, 'query parameter is required');

  const hospital = req.user?.hospital;
  if (!hospital) throw new ApiError(403, 'User hospital context required');

  const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const limit = parseInt(req.query.limit, 10) || 10;

  // Search patients by name or MRN
  const patientsPromise = Patient.find({
    hospital,
    $or: [
      { firstName: re },
      { lastName: re },
      { hospitalId: re }
    ]
  }).limit(limit).lean();

  // Search encounters by chief complaint, notes
  const encountersPromise = Encounter.find({
    hospital,
    $or: [
      { chiefComplaint: re },
      { notes: re },
      { historyOfPresentIllness: re }
    ]
  }).limit(limit).lean();

  // Labs
  const labsPromise = LabResult.find({ hospital, 'tests.testName': re }).limit(limit).lean();

  // Imaging
  const imagingPromise = ImagingReport.find({ hospital, $or: [{ report: re }, { modality: re }] }).limit(limit).lean();

  // Prescriptions
  const prescriptionsPromise = Prescription.find({ hospital, 'items.name': re }).limit(limit).lean();

  const [patients, encounters, labs, imaging, prescriptions] = await Promise.all([
    patientsPromise,
    encountersPromise,
    labsPromise,
    imagingPromise,
    prescriptionsPromise,
  ]);

  // Normalize results with a type tag
  const results = [];

  patients.forEach(p => results.push({ type: 'patient', id: p._id, title: `${p.firstName || ''} ${p.lastName || ''}`.trim(), hospital_id: p.hospital, snippet: p.hospitalId || '', raw: p }));
  encounters.forEach(e => results.push({ type: 'encounter', id: e._id, title: e.chiefComplaint || `Encounter ${e._id}`, hospital_id: e.hospital, snippet: e.historyOfPresentIllness || e.notes || '', raw: e }));
  labs.forEach(l => results.push({ type: 'lab', id: l._id, title: l.tests && l.tests.length ? l.tests[0].testName : `Lab ${l._id}`, hospital_id: l.hospital, snippet: '', raw: l }));
  imaging.forEach(img => results.push({ type: 'imaging', id: img._id, title: img.modality || `Imaging ${img._id}`, hospital_id: img.hospital, snippet: img.report || '', raw: img }));
  prescriptions.forEach(pres => results.push({ type: 'prescription', id: pres._id, title: pres.items && pres.items.length ? pres.items[0].name : `Prescription ${pres._id}`, hospital_id: pres.hospital, snippet: '', raw: pres }));

  return res.status(200).json({ success: true, data: { results } });
});

export default { localSearch };
