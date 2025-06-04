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
    searchAvailableUsers,
    serachAvailableUserList
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

router.route("/:serverId/users").get(searchAvailableUsers);
router.route("/users").get(serachAvailableUserList);
router
  .route("/create")
  .post(verifyPermission([RolesEnum.FACULTY,RolesEnum.ADMIN,RolesEnum.PRIVILEGED_STUDENT]),upload.single("avatar"),(req, res, next) => {
      if (typeof req.body.participants === "string") {
        try {
          req.body.participants = JSON.parse(req.body.participants);
        } catch (e) {
          req.body.participants = [];
        }
      }
      next();
    },createAGroupChatValidator(), validate, createServer);

router
  .route("/:serverId/currentServer")
  .get(PostgresPathVariableValidator("serverId"), validate, getServerDetails)
  .patch(verifyPermission([RolesEnum.FACULTY,RolesEnum.ADMIN,RolesEnum.PRIVILEGED_STUDENT]),
    PostgresPathVariableValidator("serverId"),
    updateGroupChatNameValidator(),
    validate,
    renameServer
  )
  .delete(verifyPermission([RolesEnum.FACULTY,RolesEnum.ADMIN,RolesEnum.PRIVILEGED_STUDENT]),PostgresPathVariableValidator("serverId"), validate, deleteServer);

router
  .route("/Participant/:serverId/:memberId")
  .post(verifyPermission([RolesEnum.FACULTY,RolesEnum.ADMIN,RolesEnum.PRIVILEGED_STUDENT]),
    PostgresPathVariableValidator("serverId"),
    PostgresPathVariableValidator("memberId"),
    validate,
    addNewParticipantinServer
  )
  .delete(
    verifyPermission([RolesEnum.FACULTY,RolesEnum.ADMIN,RolesEnum.PRIVILEGED_STUDENT]),
    PostgresPathVariableValidator("serverId"),
    PostgresPathVariableValidator("memberId"),
    validate,
    removeParticipantFromServer
  );

router
  .route("/leave/:serverId")
  .delete(PostgresPathVariableValidator("serverId"), validate, leaveServer);

export default router;
