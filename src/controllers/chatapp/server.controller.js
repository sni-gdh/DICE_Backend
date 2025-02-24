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
import { Op } from 'sequelize';



const Server_structure = ()=>{
    return {include : [{
        model: Channel,
        as: 'ServerChannels',
        include: [
          {
            model: User,
            as: 'members',
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
      },
    ]
}
}

const deleteCascadeServerMessages = async(ServerId)=>{
    const ChannelId = await Channel.findAll({
        where : {serverId : ServerId},
        attributes : ["id"]
    })
    const channelIds = ChannelId.map((channel) => channel.id);
    let attachments = [];
    const threads = await Promise.all(
        channelIds.map(async(channel)=>{
            return await Thread.findAll({
                where : {channelId : channel},
                attributes : ['id']
            })
        })
    )
    const ThreadsId =  threads.map((threadId) => threadId.id);
    const messages =  await Message.find(
                {
                    threadId : {$in : ThreadsId}
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
        threadId : { $in : ThreadsId}
    })

    await Thread.destroy({
        where : {
            channelId : {[Op.in] : channelIds} 
        }
    })

    await Channel.destroy({
        where : {
            serverId : ServerId
        }
    })
}

const SerarchAvailableUsers = asyncHandler(async(req,res)=>{
    try {
        const users = await User.findAll({
            where : {
                id : {
                    [Op.ne] : req.user.id
                }
            },
            attributes : ['name','avatar','univ_mail']
        })
        return res.
        status(200)
        .json(new ApiResponse(200,users,"Users fetched Successfully"));
    } catch (error) {
        console.log('Error fetching details from Server',error);
        throw new ApiError(500,"Internal server error")
    }
})

const createServer = asyncHandler(async(req,res)=>{
    const {server_name , avatar , members} = req.body;

    if(members.includes(req.user.id.toString())){
        throw new ApiError(400 , "Member array should not contain the server creator");
    }

    if(!server_name || members.length === 0){
        throw new ApiError(400 , "All fields are required")
    }
    const Server_members = [...new Set([...members, req.user._id.toString()])];//checking for duplicate members

    const server = await Server.create(
        {
            server_name,
            admin : req.user.id,
            avatar,
            members : Server_members,
        }
    );
    // we dont have to do this but if we get an error we have to default create the tables.
    // const DefaultChannel = await Channel.create({
    //     name : "Announcements",
    //     serverId : server.id,
    //     participants : server.members,
    // });

    // const defaultThreads = await Promise.all(
    //     Server_members.map(async (memberId) => {
    //       return await Thread.create({
    //         channelId: DefaultChannel.id,
    //         senderId: memberId,
    //         parent_id: null,
    //         messageId: null, // Initialize with no message
    //       });
    //     })
    //   );

    const server_structure = await Server.findOne({
        where: { id: server.id },
        ...Server_structure()
      });

      const payload = server_structure

      if(!payload){
        throw new ApiError(500, "Internal server error")
      }

      payload?.members?.forEach((member) =>{
        if (member.id.toString() === req.user.id.toString()) return;
        emitSocketEvent(
            req,
            member.id?.toString(),
            ChatEventEnum.NEW_SERVER_EVENT,
            payload
          );
      });
      return res
      .status(201)
      .json(new ApiResponse(201 , payload , "Server created sucessfully"));
})

const getServerDetails = asyncHandler(async(req,res)=>{
    const {ServerId} = req.params
    const ServerDetails = await Server.findOne({
        where: { id: ServerId },
        ...Server_structure()
    });

    if(!ServerDetails){
        throw new ApiError(404 ,"Server does not exist")
    }
    return res.
    status(200)
    .json(new ApiResponse(200,ServerDetails,"Server details fetched sucessfully"));
});

const renameServer = asyncHandler(async(req,res)=>{
    const { ServerId } = req.params;
    const { name } = req.body;

    const server = await Server.findOne({
        where : {id : ServerId}
    })
    if(!server){
        throw new ApiError(404,"Server does not exist");
    }

    if(server.admin.toString() !== req.user.id.toString()){
        throw new ApiError(403,"You are not an admin")
    }

    const updatedServer = await Server.update({
        server_name : name
    },{
        where : {id:ServerId}
    })

    const serverDetails = await Server.findOne({
        where : {id : updatedServer.id},
        ...Server_structure()
    })
    if(!serverDetails){
        throw new ApiError(500, "Internal server error")
    }

    serverDetails?.members?.forEach((member)=>{
        emitSocketEvent(
            req,
            member.id?.toString(),
            ChatEventEnum.UPDATE_SERVER_NAME_EVENT,
            serverDetails
        )
    })
    return res.
    status(200)
    .json(new ApiResponse(200,serverDetails,"Server name updated sucessfully"))
})

const deleteServer = asyncHandler(async(req,res)=>{
    const {ServerId} = req.params
    const server = await Server.findOne({
        where : {id : ServerId},
        ...Server_structure()
    })

    if(!server){
        throw new ApiError(404,"Server does not exist")
    }

    if(server.admin.toString() != req.user.id.toString()){
        throw new ApiError(403,"Only admin can delete the server")
    }

    await Server.destroy({
        where : {id : ServerId}
    })

    await deleteCascadeServerMessages(ServerId)

    server?.members?.forEach((memberId)=>{
        if (memberId._id.toString() === req.user._id.toString()) return;
        emitSocketEvent(
            req,
            memberId?.id?.toString(),
            ChatEventEnum.LEAVE_Server_EVENT,
            server
        )
    })

    return res.
    status(200).
    json(new ApiResponse(200,{},"Server deleted sucessfully"));
})

const leaveServer = asyncHandler(async(req,res)=>{
    const {ServerId} = req.params;
    const server = await Server.findOne({where : {id : ServerId}})
    if(!server){
        throw new ApiError(404,"Server does not exist")
    }

    const existingMember = server.members
    if(!existingMember?.includes(req.user?.id)){
        throw new ApiError(400,"You are not a part of this Server")
    }

    const updatedMembers = existingMember.filter((member)=>member.toString() !== req.user.id.toString())
    await Server.update({
        members : updatedMembers},{
            where : {id : ServerId}
        }
    )
    await Server.save();
    const serverDetails = await Server.findOne({
        where : {id : ServerId},
        ...Server_structure(),
    })
    if(!serverDetails){
        throw new ApiError(500,"Internal server error")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, serverDetails, "Left Server successfully"));
})

const addNewParticipantinServer = asyncHandler(async(req,res)=>{
    const {ServerId , memberId} = req.params

    const server = await Server.findOne({
        where : {id : ServerId}
    })

    if(!server){
        throw new ApiError(404,"Server does not exist")
    }

    if(server.admin.toString() !== req.user.id.toString()){
        throw new ApiError(403,"Only admin can add participants")
    }

    const existingMembers = server.members;
    const newMembers = [...new Set([...existingMembers , ...memberId])]

    await Server.update({
        members : newMembers
    },{
        where : {id : ServerId}
    })

    const serverDetails = await Server.findOne({
        where : {id : ServerId},
        ...Server_structure()
    })

    if(!serverDetails){
        throw new ApiError(500,"Internal server error")
    }
    emitSocketEvent(
        req,
        memberId,
        ChatEventEnum.NEW_CHAT_EVENT,
        serverDetails
    )

    return res
    .status(200)
    .json(new ApiResponse(200,serverDetails,"Participants added sucessfully"))
})


const removeParticipantFromServer = asyncHandler(async(req,res)=>{
    const {ServerId,memberId} = req.params;

    const server = await Server.findOne({
        where : {id : ServerId}
    })
    if(!server){
        throw new ApiError(404,"Server does not exist")
    }

    if(server.admin.toString() !== req.user.id.toString()){
        throw new ApiError(403, "Only admin are allowed to remove members")
    }

    const existingparticipants = server.members
    if(!existingparticipants?.include(memberId)){
        throw new ApiError(400,"Member does not exist in the server")
    }

    const updateMember = existingparticipants.filter((member)=>member.toString() !== memberId.toString())

    const updated = await Server.update({
        members : updateMember},{
        where : {id : ServerId}
    })
    await Server.save();
    if(!updated){
        throw new ApiError(500,"Internal Server error");
    }
    const server_Details = await Server.findOne({
        where : {id : ServerId},
        ...Server_structure()
    })
    if(!server_Details){
        throw new ApiError(500,"Internal Server Error")
    }

    emitSocketEvent(req, memberId, ChatEventEnum.LEAVE_CHAT_EVENT, server_Details);

    return res
    .status(200)
    .json(new ApiResponse(200, server_Details, "Participant removed successfully"));

})


const getAllServers = asyncHandler(async(req,res)=>{
    const server = await Server.findAll({
        where : {
            members : {
                [Op.contains] : [req.user.id]
            }
        },
        order : [['updatedAt','DESC']],
        ...Server_structure(),
    });
    if(!server){
        throw new ApiError(400,"Internal server error");
    }

    return res.
    status(200).
    json(
        new ApiResponse(200,server || [],"Servers fetched successfully")
    );
})

export {
    createServer,
    getServerDetails,
    renameServer,
    deleteServer,
    leaveServer,
    addNewParticipantinServer,
    removeParticipantFromServer,
    getAllServers,
    SerarchAvailableUsers
}