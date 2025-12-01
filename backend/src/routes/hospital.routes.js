import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
createHospital,
getHospitals,
getHospitalById,
updateHospital,
deleteHospital
} from '../controllers/hospital.controller.js';


const router = Router();


router.route('/')
.post(verifyJWT, createHospital)
.get(verifyJWT, getHospitals);


router.route('/:id')
.get(verifyJWT, getHospitalById)
.patch(verifyJWT, updateHospital)
.delete(verifyJWT, deleteHospital);


export default router;