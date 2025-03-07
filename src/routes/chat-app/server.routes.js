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
import { verifyJWT } from "../../middleware/auth.middleware.js";
import {
  createAGroupChatValidator,
  updateGroupChatNameValidator,
} from "../../validator/chatapp/chat.validators.js";
import { PostgresPathVariableValidator,mongoIdPathVariableValidator } from "../../validator/common/db.validators.js";
import { validate } from "../../validator/validate.js";
import {upload} from "../../middleware/multer.middleware.js"

const router = Router();

router.use(verifyJWT);

router.route("/").get(getAllServers);

router.route("/:ServerId/users").get(searchAvailableUsers);


router
  .route("/create")
  .post(upload.single("avatar"),createAGroupChatValidator(), validate, createServer);

router
  .route("/:ServerId/currentServer")
  .get(PostgresPathVariableValidator("ServerId"), validate, getServerDetails)
  .patch(
    PostgresPathVariableValidator("ServerId"),
    updateGroupChatNameValidator(),
    validate,
    renameServer
  )
  .delete(PostgresPathVariableValidator("ServerId"), validate, deleteServer);

router
  .route("/Participant/:ServerId/:memberId")
  .post(
    PostgresPathVariableValidator("ServerId"),
    PostgresPathVariableValidator("memberId"),
    validate,
    addNewParticipantinServer
  )
  .delete(
    PostgresPathVariableValidator("ServerId"),
    PostgresPathVariableValidator("memberId"),
    validate,
    removeParticipantFromServer
  );

router
  .route("/leave/:ServerId")
  .delete(PostgresPathVariableValidator("ServerId"), validate, leaveServer);

export default router;
