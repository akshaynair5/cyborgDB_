import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
createAdmission,
getAdmissions,
getAdmissionById,
updateAdmission,
dischargePatient,
deleteAdmission
} from '../controllers/admission.controller.js';


const admissionRouter = Router();


admissionRouter.route('/')
.post(verifyJWT, createAdmission)
.get(verifyJWT, getAdmissions);


admissionRouter.route('/:id')
.get(verifyJWT, getAdmissionById)
.patch(verifyJWT, updateAdmission)
.delete(verifyJWT, deleteAdmission);


admissionRouter.route('/:id/discharge')
.post(verifyJWT, dischargePatient);


export default admissionRouter;