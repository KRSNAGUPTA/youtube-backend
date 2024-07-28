import { Router } from "express";
const router = Router();
import { upload } from "../middlewares/multer.middleware.js";

// import controllers
import { registerUser,loginUser,logoutUser} from "../controllers/user.controller.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js";


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


router.route("/login").post(
    loginUser
)

router.route("/logout").post(
    verifyJWT,
    logoutUser
)
export default router;