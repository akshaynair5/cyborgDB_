import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
createLabResult,
getLabResults,
getLabResultById,
updateLabResult,
deleteLabResult
} from '../controllers/lab.controller.js';


const labRouter = Router();


labRouter.route('/')
.post(verifyJWT, createLabResult)
.get(verifyJWT, getLabResults);


labRouter.route('/:id')
.get(verifyJWT, getLabResultById)
.patch(verifyJWT, updateLabResult)
.delete(verifyJWT, deleteLabResult);


export default labRouter;