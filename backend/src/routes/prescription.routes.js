import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
createPrescription,
getPrescriptions,
getPrescriptionById,
updatePrescription,
deletePrescription,
getPrescriptionsForPatient,
getPrescriptionsForEncounter
} from '../controllers/prescription.controller.js';

const prescriptionRouter = Router();


prescriptionRouter.route('/')
.post(verifyJWT, createPrescription)
.get(verifyJWT, getPrescriptions);

// patient-scoped list must come before the '/:id' wildcard
prescriptionRouter.get('/patient/:id', verifyJWT, getPrescriptionsForPatient);

// encounter-scoped list
prescriptionRouter.get('/encounter/:encounterId', verifyJWT, getPrescriptionsForEncounter);

prescriptionRouter.route('/:id')
.get(verifyJWT, getPrescriptionById)
.patch(verifyJWT, updatePrescription)
.delete(verifyJWT, deletePrescription);

export default prescriptionRouter;