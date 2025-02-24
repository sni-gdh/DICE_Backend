import ChatEventEnum from '../../constants.js';
import User from '../../models/user.models.js';
import Server from '../../models/server.models.js';
import Channel from '../../models/channel.models.js';
import Thread from '../../models/threads.models.js';
import Message from '../../models/message.models.js'

import {emitSocketEvent} from '../../scoket/index.js';
import {ApiError} from '../../utils/ApiError.js';
import {ApiResponse} from '../../utils/ApiResponse.js';
import {asyncHandler} from '../../utils/asyncHandler.js';
import {removeLocalFile} from '../../utils/helpers.js';
import mongoose from 'mongoose';


const channel_structure = ()=>{
    return {
        include: [
          {
            model: User,
            as: 'participants',
            attributes: { exclude: ["password", "refreshToken", "forgotPasswordToken", "forgotPasswordExpiry", "emailVerificationToken", "emailVerificationExpiry"] }
          },
          {
            model: Thread,
            as: 'ChannelThreads',
            include: [
              {
                model: User,
                as: 'sender',
                attributes: ['name', 'avatar', 'univ_mail']
              },
            ],
          },
        ],
    } 
}

const deleteCascadeChannelMessages = async (ChannelId)=>{
    const Threads = await Thread.findAll({
        where : {
            channelId : ChannelId
        }
    })
    const ThreadIds = Threads.map((Thread) => Thread.id)
    if (ThreadIds.length === 0) {
        console.log("No threads found for the given channel.");
        return;
    }
    let attachments = []
    const messages =  await Message.find(
                    {
                        threadId : {$in : ThreadIds}
                    }
                )
    attachments = attachments.concat(
        ...messages.map((message)=>{
            return message.attachments || [];
        })
    )
    attachments.forEach((attachment)=>{
        removeLocalFile(attachment.localPath);
    })
    await Message.deleteMany({
        threadId : { $in : ThreadIds}
    })
    await Thread.destroy({
        where : {
            channelId : {[Op.in] : ChannelId} 
        }
    })  
}

const SerarchAvailableUsers = asyncHandler(async(req,res)=>{
    try {
        const {channelId}  =  req.params
        const userChannel = await Channel.findOne(
            {
                where : {
                    id : channelId
                },
                attributes : ['participants']
            }
        )
        const participants = userChannel.participants || [];
        const users = await User.findAll({
            where : {
                id : {
                    [Op.in] : participants
                }
            }
        })
        return res.
        status(200)
        .json(new ApiResponse(200,users,"Users fetched Successfully"));
    } catch (error) {
        console.log("Error fetching details form channel",error);
        throw new ApiError(500,"Internal Server Error")
    }
})

const createChannel = asyncHandler(async(req,res)=>{
    try {
        const {name,participants,serverId,avatar} = req.body
        if(participants.includes(req.user.id.toString())){
            throw new ApiError(400 , "Member array should not contain the Channel creator");
        }
    
        if(!name || participants.length === 0){
            throw new ApiError(400 , "All fields are required")
        }
        const Channel_participants = [...new Set([...participants, req.user._id.toString()])];//checking for duplicate members
    
        const channel = await Channel.create(
            {
                name,
                serverId,
                participants : Channel_participants,
                avatar,
            }
        );

        const channel_structure = await Channel.findOne({
            where :{id : channel.id},
            ...channel_structure()
        })

        if(!channel_structure){
            throw new ApiError(500,"Internal Server_Channel Error")
        }

        channel_structure?.participants?.forEach((participant)=>{
            if (participant.id.toString() === req.user.id.toString()) return;
            emitSocketEvent(
                req,
                participant.id?.toString(),
                ChatEventEnum.NEW_CHANNEL_EVENT,
                channel_structure
            );
        })
        return res
        .status(201)
        .json(new ApiResponse(201 , channel_structure , "Channel created sucessfully"));
        
    } catch (error) {
        console.log("Error while creating channel",error);
        throw new ApiError(500,"Internal Server Error")
    }
})

const getChannelDetails = asyncHandler(async(req,res)=>{
    const {channelId} = req.params
    const ChannelDetails = await Server.findOne({
        where: { id: channelId },
        ...channel_structure()
    });

    if(!ChannelDetails){
        throw new ApiError(404 ,"Channel does not exist")
    }
    return res.
    status(200)
    .json(new ApiResponse(200,ChannelDetails,"Channel details fetched sucessfully"));
})

const renameChannel = asyncHandler(async(req,res)=>{
    try {
        const { channelId } = req.params;
        const { name } = req.body;

    const channel = await Channel.findOne({
        where : {id : channelId}
    })
    if(!channel){
        throw new ApiError(404,"Channel does not exist");
    }

    if(channel.admin.toString() !== req.user.id.toString()){
        throw new ApiError(403,"You are not an admin")
    }

    const updatedChannel = await Channel.update({
        name : name
    },{
        where : {id:channelId}
    })

    const channelDetails = await Server.findOne({
        where : {id : updatedChannel.id},
        ...channel_structure()
    })
    if(!channelDetails){
        throw new ApiError(500, "Internal server_channel error")
    }

    channelDetails?.participants?.forEach((participant)=>{
        emitSocketEvent(
            req,
            participant.id?.toString(),
            ChatEventEnum.UPDATE_CHANNEL_NAME_EVENT,
            channelDetails
        )
    })
    return res.
    status(200)
    .json(new ApiResponse(200,channelDetails,"Channel name updated sucessfully"))
    } catch (error) {
        console.log("Error while updating name",error);
        throw new ApiError(500,"Internal Server_Channel Error");
    }
})

const deleteChannel = asyncHandler(async(req,res)=>{
    try {
        const {channelId} = req.params
        const channel = await Channel.findOne({
            where : {id : channelId},
            ...channel_structure()
        })
    
        if(!channel){
            throw new ApiError(404,"Server does not exist")
        }
    
        if(channel.admin.toString() != req.user.id.toString()){
            throw new ApiError(403,"Only admin can delete the channel")
        }
    
        await Channel.destroy({
            where : {id : channelId}
        })
    
        await deleteCascadeChannelMessages(channelId)
    
        channel?.participants?.forEach((participant)=>{
            if (participant._id.toString() === req.user._id.toString()) return;
            emitSocketEvent(
                req,
                participant?.id?.toString(),
                ChatEventEnum.LEAVE_CHANNEL_EVENT,
                channel
            )
        })
        return res.
        status(200).
        json(new ApiResponse(200,{},"Server deleted sucessfully"));
    } catch (error) {
        console.log("Error while deleting Threads",error);
        throw new ApiError(500,"Internal Server_channel error");
    }
})

const leaveChannel = asyncHandler(async(req,res)=>{
    try{
    const {channelId} = req.params;
    const channel = await Channel.findOne({where : {id : channelId}})
    if(!channel){
        throw new ApiError(404,"Channel does not exist")
    }

    const existingParticipants = channel.participants || [];
    if(!existingParticipants?.includes(req.user?.id)){
        throw new ApiError(400,"You are not a part of this Channel")
    }

    const updatedParticipants = existingParticipants.filter((participant)=>participant.toString() !== req.user.id.toString())
    await Channel.update({
        participants : updatedParticipants},{
            where : {id : channelId}
        }
    )
    await Channel.save();
    const channelDetails = await Channel.findOne({
        where : {id : channelId},
        ...channel_structure(),
    })
    if(!channelDetails){
        throw new ApiError(500,"Internal Channel error")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, channelDetails, "Left Channel successfully"));
    }
    catch(error){
        console.log("Error while leaving channel",error);
        throw new ApiError(500,"Internal Server_channel Error while Leaving the channel")
    }
})

const addNewParticipantinChannel = asyncHandler(async(req,res)=>{
    try {
        const {channleId , participantId} = req.params

    const channel = await Channel.findOne({
        where : {id : channleId}
    })

    if(!channel){
        throw new ApiError(404,"Channel does not exist")
    }

    if(channel.admin.toString() !== req.user.id.toString()){
        throw new ApiError(403,"Only admin can add participants")
    }

    const existingParticipants = channel.participants || [];
    const newParticipants = [...new Set([...existingParticipants , ...participantId])]

    await Channel.update({
        participants : newParticipants
    },{
        where : {id : channleId}
    })

    const channelDetails = await Channel.findOne({
        where : {id : channleId},
        ...channel_structure()
    })

    if(!channelDetails){
        throw new ApiError(500,"Internal server_channel error, while adding new participant")
    }
    emitSocketEvent(
        req,
        channleId,
        ChatEventEnum.NEW_CHAT_EVENT,
        channelDetails
    )

    return res
    .status(200)
    .json(new ApiResponse(200,channelDetails,"Participants added sucessfully"))
        
    } catch (error) {
        console.log("Error while adding new participant in channel",error);
        throw new ApiError(500,"Ineternal Server_channel Error while adding participant")
    }
})

const removeParticipantFromChannel = asyncHandler(async(req,res)=>{
    try{
    const {channelId,participantId} = req.params;

    const channel = await Channel.findOne({
        where : {id : channelId}
    })
    if(!channel){
        throw new ApiError(404,"Channel does not exist")
    }

    if(channel.admin.toString() !== req.user.id.toString()){
        throw new ApiError(403, "Only admin are allowed to remove participants")
    }

    const existingparticipants = channel.participants || [];
    if(!existingparticipants?.include(participantId)){
        throw new ApiError(400,"Participants does not exist in the Channel")
    }

    const updateParticipants = existingparticipants.filter((participant)=>participant.toString() !== participantId.toString())

    const updated = await Server.update({
        members : updateParticipants},{
        where : {id : participantId}
    })
    await Channel.save();
    if(!updated){
        throw new ApiError(500,"Internal Server_channel error");
    }
    const channel_Details = await Server.findOne({
        where : {id : participantId},
        ...channel_structure()
    })
    if(!channel_Details){
        throw new ApiError(500,"Internal Server_channel Error,while removing participants")
    }

    emitSocketEvent(req, participantId, ChatEventEnum.LEAVE_CHAT_EVENT, channel_Details);

    return res
    .status(200)
    .json(new ApiResponse(200, channel_Details, "Participant removed successfully from channel"));
    }
    catch(error){
        console.log("Error while removing participant from channel",error);
        throw new ApiError(500,"Internal server_channel error while removing participant");

    }
})

const getAllChannel = asyncHandler(async(req,res)=>{
    const channel = await Channel.findAll({
        where : {
            participants : {
                [Op.contains] : [req.user.id]
            }
        },
        order : [['updatedAt','DESC']],
        ...channel_structure(),
    });
    if(!channel){
        throw new ApiError(400,"Internal server_channel error,while fetching all channels");
    }
    return res.
    status(200).
    json(
        new ApiResponse(200,channel || [],"Channel fetched successfully")
    );
})

export {
    SerarchAvailableUsers,
    createChannel,
    getChannelDetails,
    renameChannel,
    deleteChannel,
    leaveChannel,
    addNewParticipantinChannel,
    removeParticipantFromChannel,
    getAllChannel
}
