import { Router } from "express";
import {
  followUnFollowUser,
  getFollowersListByUserName,
  getFolloweeListByUserName,
  acceptAndRejectRequest,
  getListRequest,
  getSuggestedUsers
} from "../../controllers/socialMedia/follow.controllers.js";
import {
  getLoggedInUserOrIgnore,
  verifyJWT,
} from "../../middleware/auth.middleware.js";
import { validate } from "../../validator/validate.js";
import { mongoIdPathVariableValidator,PostgresPathVariableValidator } from "../../validator/common/db.validators.js";

const router = Router();

 router.use(verifyJWT)
router
  .route("/:toBeFollowedUserId")
  .post( PostgresPathVariableValidator("toBeFollowedUserId"), validate, followUnFollowUser);

router
  .route("/list/followers/:username")
  .get(getFollowersListByUserName);

router.
route("/requestStatus/:followerId")
.post(mongoIdPathVariableValidator("followerId"),validate,acceptAndRejectRequest);

router.route("/list/requesters").
get(getListRequest);

router
  .route("/list/following/:username")
  .get(getFolloweeListByUserName);

router.route("/list/Suggested/")
.get(getSuggestedUsers)

export default router;
