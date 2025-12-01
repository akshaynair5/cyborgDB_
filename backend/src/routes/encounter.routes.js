import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
createEncounter,
getEncounters,
getEncounterById,
updateEncounter,
deleteEncounter
} from '../controllers/encounter.controller.js';


const encounterRouter = Router();


encounterRouter.route('/')
.post(verifyJWT, createEncounter)
.get(verifyJWT, getEncounters);


encounterRouter.route('/:id')
.get(verifyJWT, getEncounterById)
.patch(verifyJWT, updateEncounter)
.delete(verifyJWT, deleteEncounter);


export default encounterRouter;