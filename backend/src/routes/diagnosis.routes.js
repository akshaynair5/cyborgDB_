import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
createDiagnosis,
getDiagnoses,
getDiagnosisById,
updateDiagnosis,
deleteDiagnosis,
getDiagnosesForEncounter
} from '../controllers/diagnosis.controller.js';


const diagnosisRouter = Router();


diagnosisRouter.route('/')
.post(verifyJWT, createDiagnosis)
.get(verifyJWT, getDiagnoses);

// encounter-scoped list must come before the '/:id' wildcard
diagnosisRouter.get('/encounter/:encounterId', verifyJWT, getDiagnosesForEncounter);

diagnosisRouter.route('/:id')
.get(verifyJWT, getDiagnosisById)
.patch(verifyJWT, updateDiagnosis)
.delete(verifyJWT, deleteDiagnosis);


export default diagnosisRouter;