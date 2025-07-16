// todo Add function to update avatar for Channel and its details,aff function to let admin leave channel while assigning new admin.
import { Op } from 'sequelize';
import { ChatEventEnum } from '../../constants.js';
import { User, Server, Channel, Thread, Message, ChannelUser, userServer } from '../../models/chatapp/centeralized.models.js';
import { emitSocketEvent } from '../../scoket/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { removeLocalFile, getStaticFilePath, getLocalPath } from '../../utils/helpers.js';

const deleteCascadeChannelMessages = async (channelId) => {
  try {
    const threads = await Thread.findAll({
      where: {
        channelId: channelId
      }
    });
    if(threads.length !== 0) {
    const threadIds = threads.map((thread) => thread.id);
    if (threadIds.length === 0) {
      console.log("No threads found for the given channel.");
      return;
    }

    let attachments = [];
      const messages =  await Message.find(
        {
            threadId : {$in : threadIds}
        }
    );
  
      attachments = attachments.concat(
        ...messages.map((message) => {
          return message.attachments || [];
        })
      );
  
      attachments.forEach((attachment) => {
        removeLocalFile(attachment.localPath);
      });
  
      await Message.deleteMany({
        threadId : { $in : threadIds}
    })

    await Thread.destroy({
      where: {
        channelId: channelId
      }
    });
  }
    console.log("Cascade delete of channel messages completed successfully.");
  } catch (error) {
    console.log("Error while deleting cascade channel messages", error);
    throw new ApiError(500, "Internal Server Error while deleting cascade channel messages");
  }
};

const searchAvailableUsers = asyncHandler(async (req, res) => {
  try {
    const { serverId, channelId } = req.params;
    const userChannel = await Channel.findOne({
      where: {
        serverId: serverId,
        id: channelId
      },
      include: {
        model: User,
        attributes: ['id', 'name', 'avatar', 'univ_mail'],
        through: { attributes: [] }
      },
      attributes: []
    });

    return res
      .status(200)
      .json(new ApiResponse(200, userChannel, "Users fetched successfully"));
  } catch (error) {
    console.log("Error fetching details from channel", error);
    throw new ApiError(500, "Internal Server Error");
  }
});

const createChannel = asyncHandler(async (req, res) => {
  try {
    const { name, participants } = req.body;
    const { serverId } = req.params;

    const user = await Server.findOne({
      where: { id: serverId },
      attributes: ['admin']
    });

    if (!user) {
      throw new ApiError(404, "Server does not exist");
    }

    if (user.admin.toString() !== req.user.id.toString()) {
      throw new ApiError(403, "Only Server admin can create a channel");
    }

    if (participants.includes(req.user.id.toString())) {
      throw new ApiError(400, "Member array should not contain the Channel creator");
    }

    if (!name || participants.length === 0) {
      throw new ApiError(400, "All fields are required");
    }

    const channelParticipants = [...new Set([...participants, req.user.id.toString()])]; // Checking for duplicate members

    if (!req.file?.filename) {
      throw new ApiError(400, "Avatar image is required");
    }

    // Get avatar file system URL and local path
    const avatarUrl = getStaticFilePath(req, req.file?.filename);
    const avatarLocalPath = getLocalPath(req.file?.filename);

    const channel = await Channel.create({
      name: name,
      serverId: serverId,
      avatar: {
        url: avatarUrl,
        localPath: avatarLocalPath,
      },
      admin : user.admin
    });

    await channel.addUser(channelParticipants);

    const channelStructure = await Channel.findOne({
      where: { id: channel.id },
      include: [
      {
        model: User,
        attributes: ['id', 'name', 'avatar', 'univ_mail'],
        through: { attributes: [] }
      },
      {
        model: Thread,
        include: [
          {
            model: User,
            as:"sender",
            attributes: ['id', 'name', 'avatar', 'univ_mail'],
          },
        ],
      },
    ]
    });

    if (!channelStructure) {
      throw new ApiError(500, "Internal Server_Channel Error");
    }

    channelParticipants.forEach((participant) => {
      if (participant === req.user.id) return;
      emitSocketEvent(
        req,
        participant.toString(),
        ChatEventEnum.NEW_CHANNEL_EVENT,
        channelStructure
      );
    });

    return res
      .status(201)
      .json(new ApiResponse(201, channelStructure, "Channel created successfully"));

  } catch (error) {
    console.log("Error while creating channel", error);
    throw new ApiError(500, "Internal Server Error");
  }
});

const getChannelDetails = asyncHandler(async (req, res) => {
  try {
    const { serverId, channelId } = req.params;

    const channelDetails = await Channel.findOne({
      where: { id: channelId, serverId: serverId },
      include: [
      {
        model: User,
        attributes: ['id', 'name', 'avatar', 'univ_mail'],
        through: { attributes: [] }
      },
      {
        model: Thread,
        include: [
          {
            model: User,
            as:"sender",
            attributes: ['id', 'name', 'avatar', 'univ_mail'],
          },
        ],
      },
    ]
    });

    if (!channelDetails) {
      throw new ApiError(404, "Channel does not exist");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, channelDetails, "Channel details fetched successfully"));
  } catch (error) {
    console.log("Error while fetching channel details", error);
    throw new ApiError(500, "Internal Server Error while fetching channel details");
  }
});

const renameChannel = asyncHandler(async (req, res) => {
  try {
    const { serverId, channelId } = req.params;
    const { name } = req.body;

    const channel = await Channel.findOne({
      where: {
        id: channelId,
        serverId: serverId
      }
    });

    if (!channel) {
      throw new ApiError(404, "Channel does not exist");
    }

    const server = await Server.findOne({
      where: { id: serverId },
      attributes: ['admin']
    });

    if (!server) {
      throw new ApiError(404, "Server does not exist");
    }

    if (server.admin.toString() !== req.user.id.toString()) {
      throw new ApiError(403, "You are not an admin");
    }

    await Channel.update({
      name: name
    }, {
      where: { id: channelId, serverId: serverId }
    });

    const channelDetails = await Channel.findOne({
      where: { id: channelId },
      include: [
      {
        model: User,
        attributes: ['id', 'name', 'avatar', 'univ_mail'],
        through: { attributes: [] }
      },
      {
        model: Thread,
        include: [
          {
            model: User,
            as:"sender",
            attributes: ['id', 'name', 'avatar', 'univ_mail'],
          },
        ],
      },
    ]
    });

    if (!channelDetails) {
      throw new ApiError(500, "Internal server_channel error");
    }

    const users = await ChannelUser.findAll({
      where: { channelId: channelId },
      attributes: ['userId']
    });

    const participants = users.map(user => user.userId);
    participants.forEach((participant) => {
      emitSocketEvent(
        req,
        participant.toString(),
        ChatEventEnum.UPDATE_CHANNEL_NAME_EVENT,
        channelDetails
      );
    });

    return res
      .status(200)
      .json(new ApiResponse(200, channelDetails, "Channel name updated successfully"));
  } catch (error) {
    console.log("Error while updating name", error);
    throw new ApiError(500, "Internal Server_Channel Error");
  }
});

const deleteChannel = asyncHandler(async (req, res) => {
  try {
    const { serverId, channelId } = req.params;

    const channel = await Channel.findOne({
      where: { id: channelId, serverId: serverId }
    });

    if (!channel) {
      throw new ApiError(404, "Channel does not exist");
    }

    const users = await ChannelUser.findAll({
      where: { channelId: channelId },
      attributes: ['userId']
    });

    const participants = users.map(user => user.userId);

    const server = await Server.findOne({
      where: { id: serverId },
      attributes: ['admin']
    });

    if (!server) {
      throw new ApiError(404, "Server does not exist");
    }

    if (server.admin.toString() !== req.user.id.toString()) {
      throw new ApiError(403, "Only admin can delete the channel");
    }

    await Channel.destroy({
      where: { id: channelId, serverId: serverId }
    });

    await deleteCascadeChannelMessages(channelId);

    participants.forEach((participant) => {
      if (participant.toString() === req.user.id.toString()) return;
      emitSocketEvent(
        req,
        participant.toString(),
        ChatEventEnum.LEAVE_CHANNEL_EVENT,
        channel
      );
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Channel deleted successfully"));
  } catch (error) {
    console.log("Error while deleting channel", error);
    throw new ApiError(500, "Internal Server_channel error");
  }
});

const leaveChannel = asyncHandler(async (req, res) => {
  try {
    const { serverId, channelId } = req.params;

    const server = await Server.findOne({
      where: { id: serverId }
    });

    if (!server) {
      throw new ApiError(404, "Server does not exist");
    }

    const channel = await Channel.findOne({
      where: { id: channelId, serverId: serverId }
    });

    if (!channel) {
      throw new ApiError(404, "Channel does not exist");
    }

    if (server.admin.toString() === req.user.id.toString()) {
      throw new ApiError(403, "Admin cannot leave before assigning new admin");
    }

    const users = await ChannelUser.findAll({
      where: { userId: req.user.id, channelId: channelId },
      attributes: ['id']
    });

    const leaver = users.map((user) => user.id);
    if (!leaver.includes(req.user.id)) {
      throw new ApiError(400, "You are not a part of this Channel");
    }

    await channel.removeUser(req.user.id);

    const channelDetails = await Channel.findOne({
      where: { id: channelId, serverId: serverId },
      include: [
      {
        model: User,
        attributes: ['id', 'name', 'avatar', 'univ_mail'],
        through: { attributes: [] }
      },
      {
        model: Thread,
        include: [
          {
            model: User,
            as:"sender",
            attributes: ['id', 'name', 'avatar', 'univ_mail'],
          },
        ],
      },
    ]
    });

    if (!channelDetails) {
      throw new ApiError(500, "Internal Channel error");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, channelDetails, "Left Channel successfully"));
  } catch (error) {
    console.log("Error while leaving channel", error);
    throw new ApiError(500, "Internal Server_channel Error while Leaving the channel");
  }
});

const addNewParticipantinChannel = asyncHandler(async (req, res) => {
  try {
    const { serverId, channelId } = req.params;
    let { participants } = req.body;

    // Ensure participants is an array
    if (!Array.isArray(participants) || participants.length === 0) {
      throw new ApiError(400, "Participants should be a non-empty array");
    }

    participants = [...new Set(participants)];

    const users = await User.findAll({
      where: { id: { [Op.in]: participants } }
    });

   if (users.length !== participants.length) {
        throw new ApiError(400, "One or more participants are not valid users");
    }

    const server = await Server.findOne({
      where: { id: serverId },
      attributes: ['admin']
    });

    if (!server) {
      throw new ApiError(404, "Server does not exist");
    }

    const channel = await Channel.findOne({
      where: { id: channelId, serverId: serverId }
    });

    if (!channel) {
      throw new ApiError(404, "Channel does not exist");
    }

    if (server.admin.toString() !== req.user.id.toString()) {
      throw new ApiError(403, "Only admin can add participants");
    }

    if (participants.includes(server.admin) || participants.includes(req.user.id)) {
      throw new ApiError(403, "Cannot add admin or person himself");
    }

    const count = await ChannelUser.count({
      where: { userId: { [Op.in]: participants }, channelId: channelId }
    });

    if (count > 0) {
      throw new ApiError(400, "Member exists in the Channel");
    }

    await channel.addUser(participants);

    const channelDetails = await Channel.findOne({
      where: { id: channelId, serverId: serverId },
      include: [
      {
        model: User,
        attributes: ['id', 'name', 'avatar', 'univ_mail'],
        through: { attributes: [] }
      },
      {
        model: Thread,
        include: [
          {
            model: User,
            as:"sender",
            attributes: ['id', 'name', 'avatar', 'univ_mail'],
          },
        ],
      },
    ]
    });

    if (!channelDetails) {
      throw new ApiError(500, "Internal server_channel error, while adding new participant");
    }

    participants.forEach((participant) => {
      if (participant === req.user.id) return;
      emitSocketEvent(
        req,
        participant.toString(),
        ChatEventEnum.NEW_CHAT_EVENT,
        channelDetails
      );
    });

    return res
      .status(200)
      .json(new ApiResponse(200, channelDetails, "Participants added successfully"));

  } catch (error) {
    console.log("Error while adding new participant in channel", error);
    throw new ApiError(500, "Internal Server_channel Error while adding participant");
  }
});

const removeParticipantFromChannel = asyncHandler(async (req, res) => {
  try {
    const { serverId, channelId , participantId } = req.params;

    // Check if user exists
    const user = await User.findOne({ where: { id: participantId } });
    if (!user) {
      throw new ApiError(400, "User does not exist");
    }

    // Fetch server and validate admin
    const server = await Server.findOne({
      where: { id: serverId },
      attributes: ['admin']
    });
    if (!server) {
      throw new ApiError(404, "Server does not exist");
    }

    // Fetch channel
    const channel = await Channel.findOne({
      where: { id: channelId, serverId: serverId }
    });
    if (!channel) {
      throw new ApiError(404, "Channel does not exist");
    }

    // Only admin can remove participants
    if (server.admin.toString() !== req.user.id.toString()) {
      throw new ApiError(403, "Only admin can remove participants");
    }

    // Cannot remove self or admin
    if (participantId === server.admin.toString() || participantId === req.user.id.toString()) {
      throw new ApiError(403, "Cannot remove admin or yourself");
    }

    // Remove user from channel
    await channel.removeUser(participantId);

    // Get updated channel info
    const channelDetails = await Channel.findOne({
      where: { id: channelId },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'avatar', 'univ_mail'],
          through: { attributes: [] }
        },
        {
          model: Thread,
          include: [
            {
              model: User,
              as: "sender",
              attributes: ['id', 'name', 'avatar', 'univ_mail'],
            },
          ],
        },
      ]
    });

    if (!channelDetails) {
      throw new ApiError(500, "Internal server error while removing participant");
    }

    // Emit socket event
    if (participantId !== req.user.id) {
      emitSocketEvent(
        req,
        participantId.toString(),
        ChatEventEnum.LEAVE_CHAT_EVENT,
        channelDetails
      );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, channelDetails, "Participant removed successfully from channel"));
  } catch (error) {
    console.error("Error while removing participant from channel", error);
    throw new ApiError(500, "Internal server error while removing participant");
  }
});


const getAllChannel = asyncHandler(async (req, res) => {
  try {
    const { serverId } = req.params;
    const channels = await Channel.findAll({
      where: {
        serverId: serverId,
      },
      order: [['updatedAt', 'DESC']],
    });

    if (!channels) {
      throw new ApiError(400, "Internal server_channel error, while fetching all channels");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, channels || [], "Channels fetched successfully"));
  } catch (error) {
    console.log("Error while fetching all channels", error);
    throw new ApiError(500, "Internal Server Error while fetching all channels");
  }
});

export {
  searchAvailableUsers,
  createChannel,
  getChannelDetails,
  renameChannel,
  deleteChannel,
  leaveChannel,
  addNewParticipantinChannel,
  removeParticipantFromChannel,
  getAllChannel
};

