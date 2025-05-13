import {Router} from 'express'
import {
    getMySocialProfile,
    getProfileByUserName,
    updateSocialProfile,
    createSocialProfile,
    createSocialProfileFacultyAndAdmin,
    updateFacultySocialProfile
} from '../../controllers/socialMedia/profile.controllers.js'
import {
    getLoggedInUserOrIgnore,
    verifyJWT,
  } from '../../middleware/auth.middleware.js'

// import { upload } from "../../middleware/multer.middleware.js";
import {
    getProfileByUserNameValidator,
    UpdateSocialprofileValidator ,
    CreateSocialprofileValidator,
    createSocialProfileFacultyAndAdminValidator
  } from "../../validator/socialMedia/profile.validator.js";
import { validate } from "../../validator/validate.js";
  
  const router = Router();
  router.route("/u/:username").get(
    getLoggedInUserOrIgnore,
    getProfileByUserNameValidator(),
    validate,
    getProfileByUserName
  );
  
  router.use(verifyJWT);
  
  router
  .route("/")
  .get(getMySocialProfile);

  router
    .route("/create")
    .post(CreateSocialprofileValidator(), validate, createSocialProfile);

  router
  .route("/createFaculty")
  .post(createSocialProfileFacultyAndAdminValidator(), validate, createSocialProfileFacultyAndAdmin);

  router
    .route("/update")
    .patch(UpdateSocialprofileValidator(), validate, updateSocialProfile);

  router
    .route("/updateFaculty")
    .patch(UpdateSocialprofileValidator(), validate, updateFacultySocialProfile);
  export default router;
  