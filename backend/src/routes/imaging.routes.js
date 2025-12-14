import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
    createImagingReport,
    getImagingReports,
    getImagingReportById,
    updateImagingReport,
    deleteImagingReport,
    getImagingReportsForEncounter
} from '../controllers/imaging.controller.js';


const imagingRouter = Router();


imagingRouter.route('/')
    .post(verifyJWT, createImagingReport)
    .get(verifyJWT, getImagingReports);

// encounter-scoped list must come before the '/:id' wildcard
imagingRouter.get('/encounter/:encounterId', verifyJWT, getImagingReportsForEncounter);

imagingRouter.route('/:id')
    .get(verifyJWT, getImagingReportById)
    .patch(verifyJWT, updateImagingReport)
    .delete(verifyJWT, deleteImagingReport);


export default imagingRouter;