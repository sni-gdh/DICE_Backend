import { Router } from "express";
import {
    createServer,
    getServerDetails,
    renameServer,
    deleteServer,
    leaveServer,
    addNewParticipantinServer,
    removeParticipantFromServer,
    getAllServers,
    SerarchAvailableUsers
} from "../../controllers/chatapp/channel.controllers.js";
import { verifyJWT } from "../../middleware/auth.middleware.js";
import {
  createAGroupChatValidator,
  updateGroupChatNameValidator,
} from "../../validator/chatapp/chat.validators.js";
import { mongoIdPathVariableValidator } from "../../validator/common/db.validators.js";
import { validate } from "../../validator/validate";

const router = Router();

router.use(verifyJWT);

router.route("/").get(getAllServers);

router.route("/users").get(SerarchAvailableUsers);


router
  .route("/server")
  .post(createAGroupChatValidator(), validate, createServer);

router
  .route("/server/:ServerId")
  .get(mongoIdPathVariableValidator("ServerId"), validate, getServerDetails)
  .patch(
    mongoIdPathVariableValidator("ServerId"),
    updateGroupChatNameValidator(),
    validate,
    renameServer
  )
  .delete(mongoIdPathVariableValidator("ServerId"), validate, deleteServer);

router
  .route("/server/:ServerId/:memberId")
  .post(
    mongoIdPathVariableValidator("ServerId"),
    mongoIdPathVariableValidator("memberId"),
    validate,
    addNewParticipantinServer
  )
  .delete(
    mongoIdPathVariableValidator("ServerId"),
    mongoIdPathVariableValidator("memberId"),
    validate,
    removeParticipantFromServer
  );

router
  .route("/leave/server/:ServerId")
  .delete(mongoIdPathVariableValidator("channelId"), validate, leaveServer);

export default router;
