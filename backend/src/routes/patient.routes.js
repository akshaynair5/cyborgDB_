import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
createPatient,
getPatients,
getPatientById,
updatePatient,
deletePatient
 ,suggestMrn
} from '../controllers/patient.controller.js';
import { getEncountersForPatient } from '../controllers/patient.encounters.controller.js';


const patientRouter = Router();


patientRouter.route('/')
.post(verifyJWT, createPatient)
.get(verifyJWT, getPatients);

// GET /patients/suggest-mrn
// Must be before the '/:id' wildcard route so it's not treated as an id
patientRouter.get('/suggest-mrn', verifyJWT, suggestMrn);

patientRouter.route('/:id')
.get(verifyJWT, getPatientById)
.patch(verifyJWT, updatePatient)
.delete(verifyJWT, deletePatient);

// GET /patients/:id/encounters
patientRouter.get('/:id/encounters', verifyJWT, getEncountersForPatient);

// GET /patients/suggest-mrn
// Place before the '/:id' wildcard to avoid being captured as an id
patientRouter.get('/suggest-mrn', verifyJWT, suggestMrn);


export default patientRouter;