import { Router } from "express";
import {
    getAllThread,
    sendThread,
    deleteMessage
} from "../../controllers/chatapp/thread.controller.js";
import { verifyJWT } from "../../middleware/auth.middleware.js";
import { upload } from "../../middleware/multer.middleware.js";
import { sendMessageValidator } from "../../validator/chatapp/message.validator.js";
import { mongoIdPathVariableValidator } from "../../validator/common/db.validators.js";
import { validate } from "../../validator/validate.js";

const router = Router();

router.use(verifyJWT);

router
  .route("/:chatId")
  .get(mongoIdPathVariableValidator("chatId"), validate, getAllThread)
  .post(
    upload.fields([{ name: "attachments", maxCount: 5 }]),
    mongoIdPathVariableValidator("chatId"),
    sendMessageValidator(),
    validate,
    sendThread
  );

//Delete message route based on Message id

router
  .route("/:chatId/:messageId")
  .delete(
    mongoIdPathVariableValidator("chatId"),
    mongoIdPathVariableValidator("messageId"),
    validate,
    deleteMessage
  );

export default router;
