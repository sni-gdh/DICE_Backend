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
import { verifyJWT,verifyPermission } from "../../middleware/auth.middleware.js";
import {
  createAGroupChatValidator,
  updateGroupChatNameValidator,
  ParticipnatValidator
} from "../../validator/chatapp/chat.validators.js";
import {PostgresPathVariableValidator } from "../../validator/common/db.validators.js";
import { validate } from "../../validator/validate.js";
import {upload} from "../../middleware/multer.middleware.js"
import { RolesEnum } from "../../constants.js"; 
const router = Router();

router.use(verifyJWT);

router.route("/:serverId").get(PostgresPathVariableValidator("serverId"),validate,getAllChannel);

router.route("/:serverId/:channelId/users").get(PostgresPathVariableValidator("serverId"),PostgresPathVariableValidator("channelId"),validate,searchAvailableUsers);


router
  .route("/:serverId/create")
  .post(verifyPermission([RolesEnum.FACULTY,RolesEnum.ADMIN,RolesEnum.PRIVILEGED_STUDENT]),upload.single("avatar"),PostgresPathVariableValidator('serverId'),(req, res, next) => {
      if (typeof req.body.participants === "string") {
        try {
          req.body.participants = JSON.parse(req.body.participants);
        } catch (e) {
          req.body.participants = [];
        }
      }
      next();
    },createAGroupChatValidator(), validate,createChannel);

router
  .route("/:serverId/:channelId/currentChannel")
  .get(PostgresPathVariableValidator("serverId"),PostgresPathVariableValidator("channelId"), validate, getChannelDetails)
  .patch(verifyPermission([RolesEnum.FACULTY,RolesEnum.ADMIN,RolesEnum.PRIVILEGED_STUDENT]),
    PostgresPathVariableValidator("serverId"),
    PostgresPathVariableValidator("channelId"),
    updateGroupChatNameValidator(),
    validate,
    renameChannel
  )
  .delete(verifyPermission([RolesEnum.FACULTY,RolesEnum.ADMIN,RolesEnum.PRIVILEGED_STUDENT]),PostgresPathVariableValidator("serverId"),PostgresPathVariableValidator("channelId"), validate, deleteChannel);

router
  .route("/:serverId/:channelId/Participant")
  .post(verifyPermission([RolesEnum.FACULTY,RolesEnum.ADMIN,RolesEnum.PRIVILEGED_STUDENT]),
    PostgresPathVariableValidator("serverId"),
    PostgresPathVariableValidator("channelId"),
    ParticipnatValidator(),
    validate,
    addNewParticipantinChannel
  )
  .delete(verifyPermission([RolesEnum.FACULTY,RolesEnum.ADMIN,RolesEnum.PRIVILEGED_STUDENT]),
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
