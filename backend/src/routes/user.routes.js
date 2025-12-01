import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
registerUser,
loginUser,
logoutUser,
getUsers,
getUserById,
updateUser,
deleteUser
} from '../controllers/user.controller.js';


const userRouter = Router();


userRouter.route('/register').post(registerUser);
userRouter.route('/login').post(loginUser);
userRouter.route('/logout').post(verifyJWT, logoutUser);


userRouter.route('/')
.get(verifyJWT, getUsers);


userRouter.route('/:id')
.get(verifyJWT, getUserById)
.patch(verifyJWT, updateUser)
.delete(verifyJWT, deleteUser);


export default userRouter;