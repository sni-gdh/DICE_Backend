import cookie from "cookie";
import jwt from "jsonwebtoken"
import {Server , Socket} from "socket.io"
import {ApiError} from "../utils/ApiError.js"
import {AvailableChatEvents , ChatEventEnum } from "../constants.js"
import User from "../models/user.models.js"
/**
 * @description this is a function which is responsible to allow user to join the chat represented by the chat Id. This event happenes when user switches between the chats
 * @param {Socket<import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, any>} socket
 */

const mountJoinChatEvent = (socket)=>{
    socket.on(ChatEventEnum.JOIN_CHAT_EVENT,(chatId)=>{
        console.log("User joined the chat , chatId",chatId);
        socket.join(chatId);
    });
};

/**
 * @description This function is responsible to emit the typing event to the other participants of the chat
 * @param {Socket<import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, any>} socket
 */
const mountParticipantTypingEvent = (socket) =>{
    socket.on(ChatEventEnum.TYPING_EVENT,(chatId)=>{
        socket.in(chatId).emit(ChatEventEnum.TYPING_EVENT,chatId);
    });
};

/**
 * @description This function is responsible to emit the stopped typing event to the other participants of the chat
 * @param {Socket<import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, any>} socket
 */

const mountParticipantStoppedTypingEvent = (socket)=>{
    socket.on(ChatEventEnum.STOP_TYPING_EVENT,(chatId)=>{
        socket.in(chatId).emit(ChatEventEnum.STOP_TYPING_EVENT,chatId)
    });
};


/**
 *
 * @param {Server<import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, any>} io
 */
const initializeSocketIO = (io)=>{
    return io.on("connection",async(socket)=>{
        try{
            const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
            let token = cookies?.accessToken;
            if(!token)
            {
                token = socket.handshake.auth?.token
            }
            if(!token)
            {
                throw new ApiError(400,"Un-authorized Handshake,Token is missing");
            }
            const decodeToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
            const user = User.findByPk({
                where : { id : decodeToken?.id },
            })
            // const user = await executeQuery(`select "name","univ_mail","avatar","program","course","section","join_year","created_at","update_at" from "GroupChat"."user" where "user_id" = $1`,[decodeToken?._id]);
            if(!user)
            {
                throw new ApiError(401,"Un-authorized Handshake,Token is Invalid");
            }
            socket.user = user;
            socket.join(user.id.toString());
            socket.emit(ChatEventEnum.CONNECTED_EVENT);
            console.log("user is connected , user_id :",user.id.toString());

            mountJoinChatEvent(socket)
            mountParticipantTypingEvent(socket)
            mountParticipantStoppedTypingEvent(socket)

            socket.on(ChatEventEnum.DISCONNECTED_EVENT,()=>{
                console.log("User has disconnected,userId : ",socket.user?.id);
                if(socket.user?.id){
                    socket.leave(socket.user.id);
                }
            });
        }
        catch(error){
            socket.emit(ChatEventEnum.SOCKET_ERROR_EVENT,error?.message || "something went wrong while connecting to the socket")
        };
    });
};


/**
 * 
 * @param {import("express").Request}req ->accesss the 'io' instance set at the entry point
 * @param {string}roomId ->Room where the event should be emitted
 * @param {AvailableChatEvents[0]} event -> event that should be emitted
 * @param {any} payload -> data send when emitting the event
 */

const emitSocketEvent =(req,roomId,event,payload)=>{
    req.app.get("io").in(roomId).emit(event,payload);
};

export {
    initializeSocketIO,emitSocketEvent
}