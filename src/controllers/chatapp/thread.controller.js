import { asyncHandler } from "../../utils/asyncHandler.js";
import { ChatEventEnum } from "../../constants.js";
import { User, Channel, Thread, Message, ChannelUser } from '../../models/chatapp/centeralized.models.js';
import { ApiError } from "../../utils/ApiError.js";
import { emitSocketEvent } from "../../scoket/index.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import {
  getLocalPath,
  getStaticFilePath,
  removeLocalFile,
} from "../../utils/helpers.js";
import { Op } from 'sequelize';
import mongoose from "mongoose";
import {sendNotification} from "../notification/notificaiton.controllers.js"

// todo : Make reply threads. 
const threadMessageStructure = () => {
  return {
    include: [
      {
        model: User,
        as: 'sender',
        attributes: ['name', 'avatar', 'univ_mail']
      },
    ]
  };
};

const getAllThread = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
  
    const selectChannel = await ChannelUser.findAll({
      where: { channelId: channelId },
      attributes: ['userId']
    });
  
    if (!selectChannel || selectChannel.length === 0) {
      throw new ApiError(404, "Channel does not exist");
    }
  
    const users = selectChannel.map((user) => user.userId);
    if (!users.includes(req.user.id)) {
      throw new ApiError(400, "User is not a part of this chat");
    }
  
    const messageThread = await Thread.findAll({
      where: {
        channelId: channelId
      },
      ...threadMessageStructure(),
      order: [['createdAt', 'DESC']]
    });
    const messageContent = await Message.find({
        channelId : channelId
    });
  
    const received = { messageThread, messageContent };
    return res
      .status(200)
      .json(
        new ApiResponse(200, received || [], "MessagesThreads fetched successfully")
      );
  });

const sendThread = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const { content } = req.body;

  if (!content && !req.files?.attachments?.length) {
    throw new ApiError(400, "Message content or attachment is required");
  }

  const selectedChannel = await Channel.findByPk(channelId);
  if (!selectedChannel) {
    throw new ApiError(404, "Chat does not exist");
  }

  const threadMessageFiles = [];
  if (req.files && req.files.attachments?.length > 0) {
    req.files.attachments?.map((attachment) => {
      threadMessageFiles.push({
        url: getStaticFilePath(req, attachment.filename),
        localPath: getLocalPath(attachment.filename),
      });
    });
  }

  // create new Thread instance
  const thread = await Thread.create({
    senderId: req.user.id,
    channelId: channelId,
  });

  // create new Message instance
  const message = await Message.create({
    content: content || [],
    attachments: threadMessageFiles,
    threadId: thread.id,
    senderId : req.user.id,
    channelId : channelId
  });

  await selectedChannel.update({
    lastThread: thread.id
  });
  await selectedChannel.save()
  const threadMessage = await Thread.findOne({
    where: {
      id: thread.id
    },
    ...threadMessageStructure()
  });

  const messageContent = await Message.find({
    channelId : channelId
  });

  const receivedMessage = { threadMessage, messageContent };

  if (!receivedMessage) {
    throw new ApiError(500, "Internal server error");
  }
  const users = await ChannelUser.findAll({
    where : {channelId : channelId},
    attributes : ['userId'],
    include : [
      {
        model : User,
        attributes : ['name','token']
      }
    ]
  })
  users.forEach((user) => {
    if (user.userId.toString() === req.user.id.toString()) return;
    // Notification for messages
    try{
        sendNotification("newMessage",user.User.token,[user.User.name,channelId])
    }catch(err){
      console.log("Failde to send notification to user");
    }
    // emit the receive message event to the other participants with received message as the payload
    emitSocketEvent(
      req,
      user.userId.toString(),
      ChatEventEnum.MESSAGE_RECEIVED_EVENT,
      receivedMessage
    );
  });

  return res
    .status(201)
    .json(new ApiResponse(201, receivedMessage, "Message saved successfully"));
});

const deleteMessage = asyncHandler(async (req, res) => {
  const { channelId, threadId } = req.params;

  const channel = await Channel.findOne({
    where: { id: channelId }
  });

  if (!channel) {
    throw new ApiError(404, "Channel does not exist");
  }

  const thread = await Thread.findOne({
    where: { id: threadId }
  });

  if (!thread) {
    throw new ApiError(404, "Message does not exist");
  }

  if (thread.senderId.toString() !== req.user.id.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to delete the message, you are not the sender"
    );
  }

  const message = await Message.findOne({
    where: { threadId : thread.id }
  });

  if (message.attachments.length > 0) {
    // If the message has attachments, remove the attachments from the server
    message.attachments.map((asset) => {
      removeLocalFile(asset.localPath);
    });
  }

  const messageIds = await Thread.findAll({
    where: { parent_id: thread.id },
    attributes: ['id']
  });

  const allMessages = messageIds.map((msg) => msg.id);
  allMessages.push(threadId);

  
    await Message.deleteMany({
        threadId : {
            $in : allMessages
        }
    })

  await Thread.destroy({
    where: { id: threadId, parent_id: threadId }
  });

  if (channel.lastThread.toString() === thread.id.toString()) {
    const lastMessage = await Thread.findOne({
      where: { channelId: channelId },
      order: [['createdAt', 'DESC']]
    });

    await Channel.update({
      lastThread: lastMessage ? lastMessage.id : null,
    }, {
      where: { id: channelId }
    });
  }
  const participants = await ChannelUser.findAll(
    {
      where :{channelId : channelId},
      attributes : ['userId']
    }
  );
  // logic to emit socket event about the message deleted to the other participants
  participants.forEach((participantId) => {
    // avoid emitting event to the user who is deleting the message
    if (participantId.toString() === req.user.id.toString()) return;
    // emit the delete message event to the other participants frontend with delete messageId as the payload
    emitSocketEvent(
      req,
      participantId.toString(),
      ChatEventEnum.MESSAGE_DELETE_EVENT,
      thread
    );
  });

  return res
    .status(200)
    .json(new ApiResponse(200, thread, "Thread deleted successfully"));
});

export {
  getAllThread,
  sendThread,
  deleteMessage
};


