import { Router } from "express";
const router = Router();
import { upload } from "../middlewares/multer.middleware.js";

// import controllers
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getUser,
  updateAvatar,
  updateCoverImage,
  updateAccountDetails,
  removeCoverImage,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

// use routes
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(verifyJWT, refreshAccessToken);
router.route("/update-details").post(verifyJWT, updateAccountDetails);
router.post("/update-avatar", verifyJWT, upload.single('avatar'), updateAvatar);
router.post("/update-coverimg",
    verifyJWT,
    upload.single('coverImage'),
    updateCoverImage
  );
router.route("/remove-coverimg").post( verifyJWT, removeCoverImage)
router.route("/get-user").get(getUser);
export default router;
