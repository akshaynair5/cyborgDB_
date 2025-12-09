import { Patient } from '../models/patient.model.js';
import { Admission } from '../models/admission.model.js';
import { Encounter } from '../models/encounter.model.js';
import { Prescription } from '../models/prescription.model.js';
import { LabResult } from '../models/labResult.model.js';
import { ImagingReport } from '../models/imagingReport.model.js';
import { Diagnosis } from '../models/diagnosis.model.js';

// Returns a compact dashboard summary: counts and recent items
export const getDashboardSummary = async (req, res, next) => {
  try {
    // Basic counts
    const [patientsCount, admissionsCount, encountersCount, prescriptionsCount, labCount, imagingCount] = await Promise.all([
      Patient.countDocuments(),
      Admission.countDocuments(),
      Encounter.countDocuments(),
      Prescription.countDocuments(),
      LabResult.countDocuments(),
      ImagingReport.countDocuments(),
    ]);

    // Recent items (limit to 6) and populate key references for display
    const [recentPatients, recentAdmissions, recentEncounters] = await Promise.all([
      Patient.find().sort({ createdAt: -1 }).limit(6).lean(),
      Admission.find().sort({ admittedAt: -1 }).limit(6).populate('patient', 'firstName lastName hospitalId').lean(),
      Encounter.find().sort({ startedAt: -1 }).limit(6).populate('patient', 'firstName lastName hospitalId').lean(),
    ]);

    return res.json({
      counts: {
        patients: patientsCount,
        activeAdmissions: admissionsCount,
        encounters: encountersCount,
        prescriptions: prescriptionsCount,
        labResults: labCount,
        imagingReports: imagingCount,
      },
      recent: {
        patients: recentPatients,
        admissions: recentAdmissions,
        encounters: recentEncounters,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Returns simple trends for the last N days for quick charts
export const getDashboardTrends = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days || '7', 10);
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));

    // build an array of dates
    const labels = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      labels.push(d.toISOString().slice(0, 10));
    }

    // helper to aggregate by day for a given Model and date field
    const aggregateCounts = async (Model, dateField = 'createdAt') => {
      const pipeline = [
        { $match: { [dateField]: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: `$${dateField}` } },
            count: { $sum: 1 },
          },
        },
      ];
      const rows = await Model.aggregate(pipeline);
      const map = new Map(rows.map((r) => [r._id, r.count]));
      return labels.map((label) => map.get(label) || 0);
    };

    const [patientsTrend, encountersTrend, admissionsTrend] = await Promise.all([
      aggregateCounts(Patient, 'createdAt'),
      aggregateCounts(Encounter, 'startedAt'),
      aggregateCounts(Admission, 'admittedAt'),
    ]);

    return res.json({ labels, series: { patients: patientsTrend, encounters: encountersTrend, admissions: admissionsTrend } });
  } catch (err) {
    next(err);
  }
};

// More production-ready overview: KPIs, recent items and quick aggregates
export const getDashboardOverview = async (req, res, next) => {
  try {
    const [counts, recentPrescriptions, recentLabResults] = await Promise.all([
      // counts by type and by admission status
      (async () => {
        const [patients, admissionsTotal, activeAdmissions, dischargedAdmissions, encounters, prescriptions, labResults, imaging] = await Promise.all([
          Patient.countDocuments(),
          Admission.countDocuments(),
          Admission.countDocuments({ status: 'active' }),
          Admission.countDocuments({ status: 'discharged' }),
          Encounter.countDocuments(),
          Prescription.countDocuments(),
          LabResult.countDocuments(),
          ImagingReport.countDocuments(),
        ]);
        return { patients, admissionsTotal, activeAdmissions, dischargedAdmissions, encounters, prescriptions, labResults, imaging };
      })(),
      Prescription.find().sort({ createdAt: -1 }).limit(6).populate('patient', 'firstName lastName hospitalId').lean(),
      LabResult.find().sort({ reportedAt: -1 }).limit(6).populate('patient', 'firstName lastName hospitalId').lean(),
    ]);

    return res.json({ counts, recentPrescriptions, recentLabResults });
  } catch (err) {
    next(err);
  }
};

// Analytics: top diagnoses, admissions by ward
export const getDashboardAnalytics = async (req, res, next) => {
  try {
    // Top diagnoses by frequency
    const topDiagnoses = await Diagnosis.aggregate([
      { $group: { _id: '$description', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
      { $project: { description: '$_id', count: 1, _id: 0 } },
    ]);

    // Admissions by ward
    const admissionsByWard = await Admission.aggregate([
      { $group: { _id: { $ifNull: ['$ward', 'Unknown'] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { ward: '$_id', count: 1, _id: 0 } },
    ]);

    return res.json({ topDiagnoses, admissionsByWard });
  } catch (err) {
    next(err);
  }
};

// Alerts: flagged lab results and pending labs
export const getDashboardAlerts = async (req, res, next) => {
  try {
    const [flaggedCount, flaggedRecentRaw, pendingLabCount, pendingRecentRaw] = await Promise.all([
      LabResult.countDocuments({ 'tests.flagged': true }),
      LabResult.find({ 'tests.flagged': true }).sort({ reportedAt: -1 }).limit(6).lean(),
      LabResult.countDocuments({ status: { $ne: 'reported' } }),
      LabResult.find({ status: { $ne: 'reported' } }).sort({ collectedAt: -1 }).limit(6).lean(),
    ]);

    // populate patient names for the returned lab docs (lean returns plain objects so we map)
    const populatePatient = async (docs) => {
      if (!docs || docs.length === 0) return [];
      const ids = docs.map(d => d.patient).filter(Boolean);
      const patients = await Patient.find({ _id: { $in: ids } }).select('firstName lastName hospitalId').lean();
      const pMap = new Map(patients.map(p => [String(p._id), p]));
      return docs.map(d => ({ ...d, patient: pMap.get(String(d.patient)) || null }));
    };

    const flaggedRecent = await populatePatient(flaggedRecentRaw);
    const pendingRecent = await populatePatient(pendingRecentRaw);

    return res.json({ flaggedCount, flaggedRecent, pendingLabCount, pendingRecent });
  } catch (err) {
    next(err);
  }
};
