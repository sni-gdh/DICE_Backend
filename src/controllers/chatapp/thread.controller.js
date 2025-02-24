import { asyncHandler } from "../../utils/asyncHandler"
import { ChatEventEnum } from "../../constants.js";
import {Channel} from "../../models/channel.models.js"
import {Thread} from "../../models/threads.models.js"
import { ApiError } from "../../utils/ApiError.js"
import { emitSocketEvent } from "../../scoket/index.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ChatEventEnum } from '../../constants.js'
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Message } from "../../models/message.models.js"
import {
    getLocalPath,
    getStaticFilePath,
    removeLocalFile,
  } from "../../utils/helpers.js";



const threadMessageStructure = ()=>{
    return {
        include : [
            {
                model: User,
                as: 'sender',
                attributes: ['name', 'avatar', 'univ_mail']
            },
        ]
    }
}
const message_Content = ()=>{
    return [
        {
            $lookup: {
                from: "Message",
                foreignField: "_id",
                localField: "threadId",
                as: "messageContent",
                pipeline: [
                  {
                    $project: {
                        content: 1,
                        attachments: 1,
                        reaction_count : 1
                    },
                  },
                ],
              },
            },
        ]
}

const getAllThread = asyncHandler(async(req,res)=>{
    const {channelId} =  req.params
    const selectChannel = await Channel.findByPk(channelId)
    if(!selectChannel){
        throw new ApiError(404,"Channel does not exist")
    }

    if (!selectChannel.participants?.includes(req.user?._id)) {
        throw new ApiError(400, "User is not a part of this chat");
      }
    
    const messageThread = await Thread.findAll({
        where:{
            channelId : channelId
        },
        ...threadMessageStructure(),
        order : [['createdAt','DESC']]
    }) 

    return res
    .status(200)
    .json(
      new ApiResponse(200, messageThread || [], "MessagesThreads fetched successfully")
    );
})

const sendThread = asyncHandler(async(req,res)=>{
    const {channelId} = req.params
    const {content} = req.body
    
    if (!content && !req.files?.attachments?.length) {
        throw new ApiError(400, "Message content or attachment is required");
    }

    const selectedChannel = await Channel.findById(channelId);
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
    
    // create new Message instance
    const thread = await Thread.create({
        sender : req.user.id,
        channelId : channelId,
    })  
    const Message = await Message.create({
        content : content || [],
        attachments : threadMessageFiles,
        threadId : thread.id
    })
    
    const channel = await Channel.update({
        lastThread : thread.id
    },{
        where : {
            id:channelId
        }
    })
    await Channel.save()

    const threadMessage = await Thread.findOne({
        where : {
            id : thread.id
        },
        ...threadMessageStructure()
    });
    const messageContent = await Message.aggregate([
        {$match :  {
            _id: new mongoose.Types.ObjectId(Message._id),
          },
        },
        ...message_Content(),
    ]
    )

    threadMessage = {threadMessage , messageContent }
    if(!threadMessage){
        throw new ApiError(500, "Internal server error")
    }
    const receivedMessage =  threadMessage[0]

    channel?.participants?.forEach((participantId)=>{
    if (participantId.toString() === req.user._id.toString()) return;

    // emit the receive message event to the other participants with received message as the payload
    emitSocketEvent(
      req,
      participantId.toString(),
      ChatEventEnum.MESSAGE_RECEIVED_EVENT,
      receivedMessage
    );
    })
    return res
    .status(201)
    .json(new ApiResponse(201, receivedMessage, "Message saved successfully"));
});

const deleteMessage = asyncHandler(async(req,res)=>{
    const {channelId,threadId} = req.params

    const channel = await Channel.findOne({
        where : {id : channelId , participants : {[Op.in] : req.user.id}
    }
    })

    if(!channel){
        throw new ApiError(404, "Channel does not exist")
    }

    const thread = await Thread.findOne({
        where : {id : threadId}
    })
    if (!thread) {
        throw new ApiError(404, "Message does not exist");
    }

    if (thread.sender.toString() !== req.user._id.toString()) {
        throw new ApiError(
          403,
          "You are not the authorised to delete the message, you are not the sender"
        );
    }

    const message = await Message.findOne({
        threadId :  thread.id
    }
    )
    if (message.attachments.length > 0) {
        //If the message is attachment  remove the attachments from the server
        message.attachments.map((asset) => {
          removeLocalFile(asset.localPath);
        });
      }
    
    const MessageId = await Thread.findAll(
    {
        where : {parent_id : thread.id },
        attributes : ['id']
        } 
    )
    const AllMessages = MessageId.map((message) => message.id);

    AllMessages.push(threadId)

    await Message.deleteMany({
        threadId : {
            $in : AllMessages
        }
    })
    await Thread.destroy({
        where : {id : threadId , parent_id : threadId}
    })

    if (channel.lastThread.toString() === thread.id.toString()) {
    const lastMessage = await Thread.findOne(
      {
        where : {channelId : channelId} ,
        order : [['createdAt','DESC']] 
    }
    );

    await Channel.update( {
        lastThread: lastMessage ? lastMessage?._id : null,
    },{
        where : {id : channelId}
    });
    }
    // logic to emit socket event about the message deleted  to the other participants
    channel.participants.forEach((participantId) => {
    // here the chat is the raw instance of the chat in which participants is the array of object ids of users
    // avoid emitting event to the user who is deleting the message
    if (participantId.toString() === req.user._id.toString()) return;
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

})

export {
    getAllThread,
    sendThread,
    deleteMessage
}