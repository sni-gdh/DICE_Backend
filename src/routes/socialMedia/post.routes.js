import { Router } from "express";
import { RolesEnum, MAXIMUM_SOCIAL_POST_IMAGE_COUNT } from "../../constants.js";
import {
  createPost,
  deletePost,
  getAllPosts,
  getMyPosts,
  getPostById,
  getPostsByTag,
  getPostsByUsername,
  removePostImage,
  updatePost,
  getStudentPosts,
  getFacultyAdminAndPrivilegedPosts
} from "../../controllers/socialMedia/post.controllers.js";
import {
  getLoggedInUserOrIgnore,
  verifyJWT,
  verifyPermission
} from "../../middleware/auth.middleware.js";
import { upload } from "../../middleware/multer.middleware.js";
import {
  createPostValidator,
  tagPathVariableValidator,
  updatePostValidator,
  usernamePathVariableValidator,
} from "../../validator/socialMedia/post.validator.js";
import { validate } from "../../validator/validate.js";
import { mongoIdPathVariableValidator } from "../../validator/common/db.validators.js";

const router = Router();
router.use(verifyJWT)
router
  .route("/")
  .get(
    // getLoggedInUserOrIgnore, 
    getAllPosts)
  .post(
    // verifyJWT,
    upload.fields([
      { name: "images", maxCount: MAXIMUM_SOCIAL_POST_IMAGE_COUNT },
    ]),
    createPostValidator(),
    validate,
    createPost
  );

router.route("/get/my").get(
  // verifyJWT,
   getMyPosts);

router
  .route("/get/u/:username")
  .get(
    // getLoggedInUserOrIgnore,
    usernamePathVariableValidator(),
    validate,
    getPostsByUsername
  );

router
  .route("/get/t/:tag")
  .get(
    // getLoggedInUserOrIgnore,
    tagPathVariableValidator(),
    validate,
    getPostsByTag
  );

router
  .route("/:postId")
  .get(
    // getLoggedInUserOrIgnore,
    mongoIdPathVariableValidator("postId"),
    validate,
    getPostById
  )
  .patch(
    // verifyJWT,
    upload.fields([
      { name: "images", maxCount: MAXIMUM_SOCIAL_POST_IMAGE_COUNT },
    ]),
    mongoIdPathVariableValidator("postId"),
    updatePostValidator(),
    validate,
    updatePost
  )
  .delete(
    // verifyJWT, 
    mongoIdPathVariableValidator("postId"), validate, deletePost);

router
  .route("/remove/image/:postId/:imageId")
  .patch(
    // verifyJWT,
    mongoIdPathVariableValidator("postId"),
    mongoIdPathVariableValidator("imageId"),
    validate,
    removePostImage
  );

router
.route("/get/S")
.get(
  // verifyJWT,
  verifyPermission([RolesEnum.STUDENT,RolesEnum.PRIVILEGED_STUDENT]),getStudentPosts)

router
.route("/get/FS")
.get(
  // verifyJWT,
  verifyPermission([RolesEnum.FACULTY,RolesEnum.PRIVILEGED_STUDENT,RolesEnum.ADMIN]),getFacultyAdminAndPrivilegedPosts)

export default router;
