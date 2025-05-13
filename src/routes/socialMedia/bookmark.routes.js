import { Router } from "express";
import { verifyJWT } from "../../middleware/auth.middleware.js";
import { bookmarkUnBookmarkPost } from "../../controllers/socialMedia/bookmark.controllers.js";
import { validate } from "../../validator/validate.js";
import { getBookMarkedPosts } from "../../controllers/socialMedia/post.controllers.js";
import { mongoIdPathVariableValidator } from "../../validator/common/db.validators.js";

const router = Router();

router.use(verifyJWT);

router.route("/").get(getBookMarkedPosts);

router
  .route("/:postId")
  .post(mongoIdPathVariableValidator("postId"), validate, bookmarkUnBookmarkPost);

export default router;
