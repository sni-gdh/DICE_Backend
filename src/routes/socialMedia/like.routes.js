import { Router } from "express";
import {
  likeDislikeComment,
  likeDislikePost,
} from "../../controllers/socialMedia/like.controllers.js";
import { verifyJWT } from "../../middleware/auth.middleware.js";
import { validate } from "../../validator/validate.js";
import { mongoIdPathVariableValidator } from "../../validator/common/db.validators.js";

const router = Router();
router.use(verifyJWT)
router
  .route("/post/:postId")
  .post(mongoIdPathVariableValidator("postId"), validate, likeDislikePost);

router
  .route("/comment/:commentId")
  .post(
    mongoIdPathVariableValidator("commentId"),
    validate,
    likeDislikeComment
  );

export default router;
