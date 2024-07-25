import { Router } from "express";
const router = Router();
import registerUser from "../controllers/user.controller.js"

router.route("/register").post(registerUser)
// router.route("/login").post(login)
export default router;