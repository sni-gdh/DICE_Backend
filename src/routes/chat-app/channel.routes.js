import { Router } from "express";
import {
    SerarchAvailableUsers,
    createChannel,
    getChannelDetails,
    renameChannel,
    deleteChannel,
    leaveChannel,
    addNewParticipantinChannel,
    removeParticipantFromChannel,
    getAllChannel
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

router.route("/").get(getAllChannel);

router.route("/users").get(SerarchAvailableUsers);


router
  .route("/channel")
  .post(createAGroupChatValidator(), validate, createChannel);

router
  .route("/channel/:channelId")
  .get(mongoIdPathVariableValidator("channelId"), validate, getChannelDetails)
  .patch(
    mongoIdPathVariableValidator("channelId"),
    updateGroupChatNameValidator(),
    validate,
    renameChannel
  )
  .delete(mongoIdPathVariableValidator("channelId"), validate, deleteChannel);

router
  .route("/channel/:channelId/:participantId")
  .post(
    mongoIdPathVariableValidator("channelId"),
    mongoIdPathVariableValidator("participantId"),
    validate,
    addNewParticipantinChannel
  )
  .delete(
    mongoIdPathVariableValidator("channelId"),
    mongoIdPathVariableValidator("participantId"),
    validate,
    removeParticipantFromChannel
  );

router
  .route("/leave/channel/:channelId")
  .delete(mongoIdPathVariableValidator("channelId"), validate, leaveChannel);

export default router;
