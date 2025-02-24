import { Router } from "express";
import {
  sendJpegImage,
  sendJpgImage,
  sendPngImage,
  sendSvgImage,
  sendWebpImage,
} from "../../controllers/kitchensink/image.controllers.js";

const router = Router();

router.route("/jpeg").get(sendJpegImage);
router.route("/jpg").get(sendJpgImage);
router.route("/png").get(sendPngImage);
router.route("/svg").get(sendSvgImage);
router.route("/webp").get(sendWebpImage);

export default router;
