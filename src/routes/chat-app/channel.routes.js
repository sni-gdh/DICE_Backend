import { Router } from "express";
import {
  searchAvailableUsers,
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
  ParticipnatValidator
} from "../../validator/chatapp/chat.validators.js";
import {PostgresPathVariableValidator } from "../../validator/common/db.validators.js";
import { validate } from "../../validator/validate.js";
import {upload} from "../../middleware/multer.middleware.js"
const router = Router();

router.use(verifyJWT);

router.route("/:serverId").get(PostgresPathVariableValidator("serverId"),validate,getAllChannel);

router.route("/:serverId/:channelId/users").get(PostgresPathVariableValidator("serverId"),PostgresPathVariableValidator("channelId"),validate,searchAvailableUsers);


router
  .route("/:serverId/create")
  .post(upload.single("avatar"),PostgresPathVariableValidator('serverId'),createAGroupChatValidator(), validate,createChannel);

router
  .route("/:serverId/:channelId/currentChannel")
  .get(PostgresPathVariableValidator("serverId"),PostgresPathVariableValidator("channelId"), validate, getChannelDetails)
  .patch(
    PostgresPathVariableValidator("serverId"),
    PostgresPathVariableValidator("channelId"),
    updateGroupChatNameValidator(),
    validate,
    renameChannel
  )
  .delete(PostgresPathVariableValidator("serverId"),PostgresPathVariableValidator("channelId"), validate, deleteChannel);

router
  .route("/:serverId/:channelId/Participant")
  .post(
    PostgresPathVariableValidator("serverId"),
    PostgresPathVariableValidator("channelId"),
    ParticipnatValidator(),
    validate,
    addNewParticipantinChannel
  )
  .delete(
    PostgresPathVariableValidator("serverId"),
    PostgresPathVariableValidator("channelId"),
    ParticipnatValidator(),
    validate,
    removeParticipantFromChannel
  );

router
  .route("/:serverId/:channelId/leaveChannel")
  .delete(PostgresPathVariableValidator("serverId"),PostgresPathVariableValidator("channelId"), validate, leaveChannel);

export default router;
