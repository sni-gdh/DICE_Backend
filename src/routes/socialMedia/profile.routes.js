import {Router} from 'express'
import {
    getMySocialProfile,
    getProfileByUserName,
    updateSocialProfile,
    createSocialProfile,
    createSocialProfileFacultyAndAdmin,
    updateFacultySocialProfile,
    getProfileByUserId
} from '../../controllers/socialMedia/profile.controllers.js'
import {
    getLoggedInUserOrIgnore,
    verifyJWT,
    verifyPermission
  } from '../../middleware/auth.middleware.js'

// import { upload } from "../../middleware/multer.middleware.js";
import {
    getProfileByUserNameValidator,
    UpdateSocialprofileValidator ,
    CreateSocialprofileValidator,
    createSocialProfileFacultyAndAdminValidator
  } from "../../validator/socialMedia/profile.validator.js";
import { validate } from "../../validator/validate.js";
import {RolesEnum} from "../../constants.js"
import { PostgresPathVariableValidator } from '../../validator/common/db.validators.js';
  const router = Router();
  router.route("/u/:username").get(
    getLoggedInUserOrIgnore,
    getProfileByUserNameValidator(),
    validate,
    getProfileByUserName
  );
  
  router.route("/u/:userId").get(
    getLoggedInUserOrIgnore,
    PostgresPathVariableValidator("userId"),
    validate,
    getProfileByUserId
  )

  router.use(verifyJWT);
  
  router
  .route("/")
  .get(getMySocialProfile);

   
  router
    .route("/create")
    .post(verifyPermission([RolesEnum.STUDENT,RolesEnum.PRIVILEGED_STUDENT]),CreateSocialprofileValidator(), validate, createSocialProfile);

  router
  .route("/createFaculty")
  .post(verifyPermission([RolesEnum.FACULTY,RolesEnum.ADMIN]),createSocialProfileFacultyAndAdminValidator(), validate, createSocialProfileFacultyAndAdmin);

  router
    .route("/update")
    .patch(verifyPermission([RolesEnum.STUDENT,RolesEnum.PRIVILEGED_STUDENT]),UpdateSocialprofileValidator(), validate, updateSocialProfile);

  router
    .route("/updateFaculty")
    .patch(verifyPermission([RolesEnum.FACULTY,RolesEnum.ADMIN]),UpdateSocialprofileValidator(), validate, updateFacultySocialProfile);
  export default router;
  