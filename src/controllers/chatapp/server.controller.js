// server creation
// insert participants
// delete server 
// server Roles and Permissions
// edit server
// storage and attachment
// getServerdetails
// leave Server
// addnewParticipantsinServer
// Remove Participants
// todo Add function to update avatar for server and its details, assign admin to someone before leaving the group.

import { ChatEventEnum } from '../../constants.js';
import { User, Server, Channel, Thread, Message, userServer, ChannelUser } from '../../models/chatapp/centeralized.models.js';
import { emitSocketEvent } from '../../scoket/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { removeLocalFile, getLocalPath, getStaticFilePath } from '../../utils/helpers.js';
import { Op } from 'sequelize';

// const server_structure = () => {
//   return {
//     include: [
//       {
//         model: User,
//         attributes: ["id", "name", "univ_mail"],
//         through: { attributes: [] }
//       },
//       {
//         model: Channel,
//       },
//     ]
//   };
// };

const deleteCascadeServerMessages = async (serverId) => {
  try {
    const channels = await Channel.findAll({
      where: { serverId: serverId },
      attributes: ["id"]
    });
    const channelIds = channels.map((channel) => channel.id);
    let attachments = [];
    const threads = await Thread.findAll({
      where: { channelId: { [Op.in]: channelIds } },
      attributes: ['id']
    });
    const threadIds = threads.map((thread) => thread.id);

    const messages =  await Message.find(
        {
            threadId : {$in : threadIds}
        }
    )
    
    attachments = attachments.concat(
    ...messages.map((message)=>{
    return message.attachments;
    })
    )
    attachments.forEach((attachment)=>{
    removeLocalFile(attachment.localPath);
    })
    
    await Message.deleteMany({
    threadId : { $in : threadIds}
    })

    await Thread.destroy({
      where: { channelId: { [Op.in]: channelIds } }
    });

    await Channel.destroy({
      where: { serverId: serverId }
    });

    console.log("Cascade delete of server messages completed successfully.");
  } catch (error) {
    console.log("Error while deleting cascade server messages", error);
    throw new ApiError(500, "Internal Server Error while deleting cascade server messages");
  }
};

const serachAvailableUserList = asyncHandler(async(req,res)=>{
  try {
    // Exclude the currently logged-in user
    const users = await User.findAll({
      where: {
        id: { [Op.ne]: req.user.id }
      },
      attributes: ['id', 'avatar', 'name', 'univ_mail']
    });
    return res
      .status(200)
      .json(new ApiResponse(200, users, "Users fetched successfully"));
  } catch (error) {
    console.log('Error fetching available users', error);
    throw new ApiError(500, "Internal server error");
  }
})

const searchAvailableUsers = asyncHandler(async (req, res) => {
  try {
    const { serverId } = req.params;
    const server = await Server.findByPk(serverId, {
      include: [{
        model: User,
        attributes: ['id', 'name', 'avatar', 'univ_mail'],
        as : "members",
        through: { attributes: [] }
      }],
    });
    return res
      .status(200)
      .json(new ApiResponse(200, server, "Users fetched successfully"));
  } catch (error) {
    console.log('Error fetching details from server', error);
    throw new ApiError(500, "Internal server error");
  }
});

const createServer = asyncHandler(async (req, res) => {
  try {
    const { name, participants } = req.body;
    if (participants.includes(req.user.id.toString())) {
      throw new ApiError(400, "Member array should not contain the server creator");
    }

    if (!name || participants.length === 0) {
      throw new ApiError(400, "All fields are required");
    }

    const serverMembers = [...new Set([...participants, req.user.id.toString()])]; // Checking for duplicate members

    const server = await Server.create({
      server_name: name,
      admin: req.user.id,
    });
    await server.addUsers(serverMembers);

    if (!req.file?.filename) {
      throw new ApiError(400, "Avatar image is required");
    }

    // Get avatar file system URL and local path
    const avatarUrl = getStaticFilePath(req, req.file?.filename);
    const avatarLocalPath = getLocalPath(req.file?.filename);

    await Server.update({
      avatar: {
        url: avatarUrl,
        localPath: avatarLocalPath,
      },
    }, {
      where: { id: server.id },
    });

    // Create default channel
    try {
  const defaultChannel = await Channel.create({
    name: "Announcement",
    serverId: server.id,
    admin : req.user.id
  });
  await defaultChannel.addUsers(serverMembers);
    } catch (error) {
      console.error("Error adding users to channel:", error);
    }

    const serverStructure = await Server.findOne({
      where: { id: server.id }, 
      include: [
        {
          model: User,
          attributes: ["id", "name", "univ_mail"],
          through: { attributes: [] }
        },
        {
          model: Channel,
        },
      ]
    });

    if (!serverStructure) {
      throw new ApiError(500, "Internal server error");
    }

    serverMembers.forEach((member) => {
      if (member === req.user.id) return;
      emitSocketEvent(
        req,
        member.toString(),
        ChatEventEnum.NEW_SERVER_EVENT,
        serverStructure
      );
    });

    return res
      .status(201)
      .json(new ApiResponse(201, serverStructure, "Server created successfully"));
  } catch (error) {
    console.log("Error while creating server", error);
    throw new ApiError(500, "Internal Server Error");
  }
});

const getServerDetails = asyncHandler(async (req, res) => {
  try {
    const { serverId } = req.params;
    if(!serverId){
      throw new ApiError(400,"serverId is undefined")
    }
    const serverDetails = await Server.findOne({
      where: { id: serverId },
      include: [
        {
          model: User,
          attributes: ["id", "name", "univ_mail","avatar"],
          as : "members",
          through: { attributes: [] }
        },
        {
          model: Channel,
        },
      ]
    });

    if (!serverDetails) {
      throw new ApiError(404, "Server does not exist");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, serverDetails, "Server details fetched successfully"));
  } catch (error) {
    console.log("Error while fetching server details", error);
    throw new ApiError(500, "Internal Server Error while fetching server details");
  }
});

const renameServer = asyncHandler(async (req, res) => {
  try {
    const { name } = req.body;
    const { serverId } = req.params;
    const server = await Server.findOne({
      where: { id: serverId }
    });
    if (!server) {
      throw new ApiError(404, "Server does not exist");
    }

    if (server.admin.toString() !== req.user.id.toString()) {
      throw new ApiError(403, "You are not an admin");
    }

    await Server.update({
      server_name: name
    }, {
      where: { id: server.id }
    });

    const serverDetails = await Server.findOne({
      where: { id: server.id },
      include: [
        {
          model: User,
          attributes: ["id", "name", "univ_mail","avatar"],
          through: { attributes: [] }
        },
        {
          model: Channel,
        },
      ]
    });
    if (!serverDetails) {
      throw new ApiError(500, "Internal server error");
    }
    serverDetails.Users.forEach((User) => {
      emitSocketEvent(
        req,
        User.id.toString(),
        ChatEventEnum.UPDATE_SERVER_NAME_EVENT,
        serverDetails
      );
    });

    return res
      .status(200)
      .json(new ApiResponse(200, serverDetails, "Server name updated successfully"));
  } catch (error) {
    console.log("Error while renaming server", error);
    throw new ApiError(500, "Internal Server Error");
  }
});

const deleteServer = asyncHandler(async (req, res) => {
  try {
    const { serverId } = req.params;
    const server = await Server.findOne({
      where: { id: serverId },
      include: [
        {
          model: User,
          attributes: ["id", "name", "univ_mail"],
          through: { attributes: [] }
        },
        {
          model: Channel,
        },
      ]
    });

    if (!server) {
      throw new ApiError(404, "Server does not exist");
    }

    if (server.admin.toString() !== req.user.id.toString()) {
      throw new ApiError(403, "Only admin can delete the server");
    }

    await Server.destroy({
      where: { id: serverId }
    });

    await deleteCascadeServerMessages(serverId);

    server.Users.forEach((User) => {
      if (User.id === req.user.id) return;
      emitSocketEvent(
        req,
        User.id.toString(),
        ChatEventEnum.LEAVE_SERVER_EVENT,
        server
      );
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Server deleted successfully"));
  } catch (error) {
    console.log("Error while deleting server", error);
    throw new ApiError(500, "Internal Server Error");
  }
});

const leaveServer = asyncHandler(async (req, res) => {
  try {
    const { serverId } = req.params;
    const server = await Server.findOne({
      where: { id: serverId }
    });

    if (!server) {
      throw new ApiError(404, "Server does not exist");
    }

    const memberId = req.user.id;
    const user = await User.findByPk(memberId);

    if (!user) {
      throw new ApiError(400, "User does not exist");
    }

    const count = await userServer.count({
      where: { userId: memberId, serverId: serverId }
    });

    if (count === 0) {
      throw new ApiError(400, "Member does not exist in the server");
    }

    if (server.admin.toString() === req.user.id.toString()) {
      throw new ApiError(403, "Admin cannot leave the server, they can only delete it");
    }

    await server.removeUser(memberId);

    const serverDetails = await Server.findOne({
      where: { id: serverId },
      include: [
        {
          model: User,
          attributes: ["id", "name", "univ_mail"],
          through: { attributes: [] }
        },
        {
          model: Channel,
        },
      ]
    });

    if (!serverDetails) {
      throw new ApiError(500, "Internal server error");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, serverDetails, "Left server successfully"));
  } catch (error) {
    console.log("Error while leaving server", error);
    throw new ApiError(500, "Internal Server Error while leaving the server");
  }
});

const addNewParticipantinServer = asyncHandler(async (req, res) => {
  try {
    const { serverId } = req.params;
    const {participants} = req.body;

    if (participants.includes(req.user.id.toString())) {
      throw new ApiError(400, "Member array should not contain the server creator");
    }
    if (participants.length === 0) {
      throw new ApiError(400, "All fields are required");
    }


    const server = await Server.findOne({
      where: { id: serverId }
    });

    if (!server) {
      throw new ApiError(404, "Server does not exist");
    }

    if (server.admin.toString() !== req.user.id.toString()) {
      throw new ApiError(403, "Only admin can add participants");
    }

    const user = await User.findAll({
      where : {id : { [Op.in] : participants } }
    });

    if (user.length !== participants.length) {
      throw new ApiError(400, "One or more participants are not valid users");
    }
    const newMembers = []
    for (const memberId of participants) {
    const count = await userServer.count({
      where: { userId: memberId, serverId: serverId }
    });

    if (count > 0) {
      throw new ApiError(400, `Member with id ${memberId} exists in the server`);
    }
    newMembers.push(memberId)
    }
    await server.addUsers(newMembers);

    const serverDetails = await Server.findOne({
      where: { id: serverId },
      include: [
        {
          model: User,
          attributes: ["id", "name", "univ_mail","avatar"],
          through: { attributes: [] }
        },
        {
          model: Channel,
        },
      ]
    });

    if (!serverDetails) {
      throw new ApiError(500, "Internal server error");
    }

    newMembers.forEach((memberId) => {
      emitSocketEvent(
      req,
      memberId,
      ChatEventEnum.NEW_CHAT_EVENT,
      serverDetails
      );
    });
    

    return res
      .status(200)
      .json(new ApiResponse(200, serverDetails, "Participant(s) added successfully"));
  } catch (error) {
    console.log("Error while adding new participant in server", error);
    throw new ApiError(500, "Internal Server Error while adding participant");
  }
});

const removeParticipantFromServer = asyncHandler(async (req, res) => {
  try {
    const { serverId, memberId } = req.params;

    const server = await Server.findOne({
      where: { id: serverId }
    });

    if (!server) {
      throw new ApiError(404, "Server does not exist");
    }

    if (server.admin.toString() !== req.user.id.toString()) {
      throw new ApiError(403, "Only admin can remove participants");
    }

    const user = await User.findByPk(memberId);

    if (!user) {
      throw new ApiError(400, "User does not exist");
    }

    const count = await userServer.count({
      where: { userId: memberId, serverId: serverId }
    });

    if (count === 0) {
      throw new ApiError(400, "Member does not exist in the server");
    }

    await server.removeUser(memberId);
    const channels = await Channel.findAll({
        where: {
          serverId: serverId
        }
      });

      for (const ch of channels) {
        const isMember = await ChannelUser.findOne({
          where: {
            userId: memberId,
            channelId: ch.id
          }
        });

        if (isMember) {
          await ch.removeUser(memberId);
        }
      }

    const serverDetails = await Server.findOne({
      where: { id: serverId },
      include: [
        {
          model: User,
          attributes: ["id", "name", "univ_mail"],
          through: { attributes: [] }
        },
        {
          model: Channel,
        },
      ]
    });

    if (!serverDetails) {
      throw new ApiError(500, "Internal server error");
    }

    emitSocketEvent(
      req,
      memberId,
      ChatEventEnum.LEAVE_CHAT_EVENT,
      serverDetails
    );

    return res
      .status(200)
      .json(new ApiResponse(200, serverDetails, "Participant removed successfully"));
  } catch (error) {
    console.log("Error while removing participant from server", error);
    throw new ApiError(500, "Internal Server Error while removing participant");
  }
});

const getAllServers = asyncHandler(async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'avatar', 'univ_mail'],
      include: [{
        model: Server,
        as : "joinedServers"
      }]
    });

    if (!user) {
      throw new ApiError(400, "Internal server error");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, user || [], "Servers fetched successfully"));
  } catch (error) {
    console.log("Error while fetching all servers", error);
    throw new ApiError(500, "Internal Server Error while fetching all servers");
  }
});

export {
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
};




