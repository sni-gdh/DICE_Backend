// todo remove cloudinary from every where as we are not storing data in it.
import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    forgotPasswordRequest,
    updateUserAvatar,
    verifyUserEmail,
    resendEmailVerification,
    resetForgottenPassword
     } from "../controllers/user/user.controllers.js";
import { 
    verifyJWT
 } from "../middleware/auth.middleware.js";
//
import {
  userRegisterValidator,
  userChangeCurrentPasswordValidator,
  userForgotPasswordValidator,
  userLoginValidator,
  userResetForgottenPasswordValidator,
} from "../validator/user/user.validator.js"
import {validate} from "../validator/validate.js"
import {upload} from "../middleware/multer.middleware.js"


const router = Router();

// unsecure routes
router.route("/register").post(upload.single('avatar'),userRegisterValidator(),validate,registerUser) //upload.single('avatar'),
router.route("/login").post(userLoginValidator(),validate,loginUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/verify-email/:verificationToken").get(verifyUserEmail);
router
  .route("/forgot-password")
  .post(userForgotPasswordValidator(), validate,forgotPasswordRequest);
router
  .route("/reset-password/:resetToken")
  .post(
    userResetForgottenPasswordValidator(),
    validate,
    resetForgottenPassword
  );

// secure routes.
router.route("/logout").post(verifyJWT , logoutUser)
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/current-user").get(verifyJWT,getCurrentUser);
router.route("/change-password").post(verifyJWT,
    userChangeCurrentPasswordValidator(),
    validate,
    changeCurrentPassword);
router.route("/resend-email-verification").post(verifyJWT,resendEmailVerification);


export default router;
