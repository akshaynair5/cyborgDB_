import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
    createImagingReport,
    getImagingReports,
    getImagingReportById,
    updateImagingReport,
    deleteImagingReport
} from '../controllers/imaging.controller.js';


const imagingRouter = Router();


imagingRouter.route('/')
    .post(verifyJWT, createImagingReport)
    .get(verifyJWT, getImagingReports);


imagingRouter.route('/:id')
    .get(verifyJWT, getImagingReportById)
    .patch(verifyJWT, updateImagingReport)
    .delete(verifyJWT, deleteImagingReport);


export default imagingRouter;