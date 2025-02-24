import { Router } from "express";
import { redirectToTheUrl } from "../../controllers/kitchensink/redirect.controllers.js";
import { redirectToTheUrlValidator } from "../../validator/kitchen-sink/redrict.validators.js";
import { validate } from "../../validator/validate.js";

const router = Router();

router
  .route("/to")
  .get(redirectToTheUrlValidator(), validate, redirectToTheUrl);

export default router;
