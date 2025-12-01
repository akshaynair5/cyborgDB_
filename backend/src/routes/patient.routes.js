import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
createPatient,
getPatients,
getPatientById,
updatePatient,
deletePatient
} from '../controllers/patient.controller.js';


const patientRouter = Router();


patientRouter.route('/')
.post(verifyJWT, createPatient)
.get(verifyJWT, getPatients);


patientRouter.route('/:id')
.get(verifyJWT, getPatientById)
.patch(verifyJWT, updatePatient)
.delete(verifyJWT, deletePatient);


export default patientRouter;