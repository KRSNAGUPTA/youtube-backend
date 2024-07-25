import { Router } from "express";
const router = Router();
import { upload } from "../middlewares/multer.middleware.js";

// import controllers
import registerUser from "../controllers/user.controller.js"


// use routes
router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount:1
        },{
            name:"coverImage",
            maxCount : 1
        }
    ]),
    registerUser
)


// router.route("/login").post(login)
export default router;