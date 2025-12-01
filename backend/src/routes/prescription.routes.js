import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
createPrescription,
getPrescriptions,
getPrescriptionById,
updatePrescription,
deletePrescription
} from '../controllers/prescription.controller.js';

const prescriptionRouter = Router();


prescriptionRouter.route('/')
.post(verifyJWT, createPrescription)
.get(verifyJWT, getPrescriptions);


prescriptionRouter.route('/:id')
.get(verifyJWT, getPrescriptionById)
.patch(verifyJWT, updatePrescription)
.delete(verifyJWT, deletePrescription);


export default prescriptionRouter;