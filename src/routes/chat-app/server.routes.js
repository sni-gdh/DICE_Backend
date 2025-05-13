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
    searchAvailableUsers
} from "../../controllers/chatapp/server.controller.js";
import { verifyJWT,verifyPermission } from "../../middleware/auth.middleware.js";
import {
  createAGroupChatValidator,
  updateGroupChatNameValidator,
} from "../../validator/chatapp/chat.validators.js";
import { PostgresPathVariableValidator,mongoIdPathVariableValidator } from "../../validator/common/db.validators.js";
import { validate } from "../../validator/validate.js";
import {upload} from "../../middleware/multer.middleware.js"
import { RolesEnum } from "../../constants.js";


const router = Router();

router.use(verifyJWT);

router.route("/").get(getAllServers);

router.route("/:ServerId/users").get(searchAvailableUsers);


router
  .route("/create")
  .post(verifyPermission([RolesEnum.FACULTY,RolesEnum.ADMIN,RolesEnum.PRIVILEGED_STUDENT]),upload.single("avatar"),createAGroupChatValidator(), validate, createServer);

router
  .route("/:ServerId/currentServer")
  .get(PostgresPathVariableValidator("ServerId"), validate, getServerDetails)
  .patch(verifyPermission([RolesEnum.FACULTY,RolesEnum.ADMIN,RolesEnum.PRIVILEGED_STUDENT]),
    PostgresPathVariableValidator("ServerId"),
    updateGroupChatNameValidator(),
    validate,
    renameServer
  )
  .delete(verifyPermission([RolesEnum.FACULTY,RolesEnum.ADMIN,RolesEnum.PRIVILEGED_STUDENT]),PostgresPathVariableValidator("ServerId"), validate, deleteServer);

router
  .route("/Participant/:ServerId/:memberId")
  .post(verifyPermission([RolesEnum.FACULTY,RolesEnum.ADMIN,RolesEnum.PRIVILEGED_STUDENT]),
    PostgresPathVariableValidator("ServerId"),
    PostgresPathVariableValidator("memberId"),
    validate,
    addNewParticipantinServer
  )
  .delete(
    verifyPermission([RolesEnum.FACULTY,RolesEnum.ADMIN,RolesEnum.PRIVILEGED_STUDENT]),
    PostgresPathVariableValidator("ServerId"),
    PostgresPathVariableValidator("memberId"),
    validate,
    removeParticipantFromServer
  );

router
  .route("/leave/:ServerId")
  .delete(PostgresPathVariableValidator("ServerId"), validate, leaveServer);

export default router;
