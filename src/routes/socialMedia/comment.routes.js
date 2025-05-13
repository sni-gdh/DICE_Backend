import { Router } from "express";
import {
  addComment,
  deleteComment,
  getPostComments,
  updateComment,
} from "../../controllers/socialMedia/comment.controllers.js";
import {
  getLoggedInUserOrIgnore,
  verifyJWT,
} from "../../middleware/auth.middleware.js";
import {
  commentContentValidator,
} from "../../validator/socialMedia/comment.validator.js";
import { validate } from "../../validator/validate.js";
import { mongoIdPathVariableValidator } from "../../validator/common/db.validators.js";

const router = Router();

router.use(verifyJWT)

router
  .route("/post/:postId")
  .get(
    mongoIdPathVariableValidator("postId"),
    validate,
    getPostComments
  )
  .post(
    mongoIdPathVariableValidator("postId"),
    commentContentValidator(),
    validate,
    addComment
  );

router
  .route("/:commentId")
  .delete(mongoIdPathVariableValidator("commentId"), validate, deleteComment)
  .patch(
    mongoIdPathVariableValidator("commentId"),
    commentContentValidator(),
    validate,
    updateComment
  );

export default router;
