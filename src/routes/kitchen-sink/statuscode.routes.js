import { Router } from "express";
import {
  getAllStatusCodes,
  getStatusCode,
} from "../../controllers/kitchensink/statuscode.controllers.js";
import { statusCodeValidator } from "../../validator/kitchen-sink/statuscode.validators.js";
import { validate } from "../../validator/validate.js";

const router = Router();

router.route("/").get(getAllStatusCodes);

router
  .route("/:statusCode")
  .get(statusCodeValidator(), validate, getStatusCode);

export default router;
