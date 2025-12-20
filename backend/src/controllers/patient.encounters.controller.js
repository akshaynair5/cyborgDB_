import { Encounter } from '../models/encounter.model.js';
import ApiError from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/AsyncHandler.js';

// GET /patients/:id/encounters
export const getEncountersForPatient = asyncHandler(async (req, res) => {
  const patientId = req.params.id;
  // Only return encounters belonging to requester's hospital (or admin)
  const hospitalId = req.user?.hospital;

  if (!patientId) throw new ApiError(400, 'Patient id required');

  const query = { patient: patientId };
  if (hospitalId) query.hospital = hospitalId;

  const encounters = await Encounter.find(query)
    .sort({ startedAt: -1 })
    .limit(200)
    .populate('seenBy', 'firstName lastName role')
    .populate('diagnoses', 'description code')
    .lean();

  return res.status(200).json(new ApiResponse(200, { encounters }));
});

export default { getEncountersForPatient };
