import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
getAuditLogs,
getAuditLogById
} from '../controllers/audit.controller.js';


const auditRouter = Router();


auditRouter.route('/')
.get(verifyJWT, getAuditLogs);


auditRouter.route('/:id')
.get(verifyJWT, getAuditLogById);


export default auditRouter;