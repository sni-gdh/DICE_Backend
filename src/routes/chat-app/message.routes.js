import { Router } from "express";
import {
    getAllThread,
    sendThread,
    deleteMessage
} from "../../controllers/chatapp/thread.controller.js";
import { verifyJWT } from "../../middleware/auth.middleware.js";
import { upload } from "../../middleware/multer.middleware.js";
import { sendMessageValidator } from "../../validator/chatapp/message.validator.js";
import { PostgresPathVariableValidator } from "../../validator/common/db.validators.js";
import { validate } from "../../validator/validate.js";

const router = Router();

router.use(verifyJWT);

router
  .route("/:channelId")
  .get(PostgresPathVariableValidator("channelId"), validate, getAllThread)
  .post(
    upload.fields([{ name: "attachments", maxCount: 5 }]),
    PostgresPathVariableValidator("channelId"),
    sendMessageValidator(),
    validate,
    sendThread
  );

//Delete message route based on Message id

router
  .route("/:channelId/:threadId")
  .delete(
    PostgresPathVariableValidator("channelId"),
    PostgresPathVariableValidator("threadId"),
    validate,
    deleteMessage
  );

export default router;
