import { Router } from "express";
import {
  getCookies,
  removeCookie,
  setCookie,
} from "../../controllers/kitchensink/cookie.controller.js";
import {cookieKeyQueryStringValidator}  from "../../validator/kitchen-sink/cookie.validators.js";
import { validate } from "../../validator/validate.js";

const router = Router();

router.route("/get").get(getCookies);
router.route("/set").post(setCookie);
router
  .route("/remove")
  .delete(cookieKeyQueryStringValidator(), validate, removeCookie);

export default router;
