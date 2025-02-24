/**
 * @type {{ADMIN : "ADMIN" , USER:"USER"} as const}
 * 
 */
const UserRolesEnum = {
    ADMIN : "ADMIN",
    USER : "USER",
}

export const AvailableUserRoles  = Object.values(UserRolesEnum);
export const USER_TEMPORARY_TOKEN_EXPIRY = 20 * 60 * 1000; // 20 minutes
export const MAXIMUM_SUB_IMAGE_COUNT = 4;
export const MAXIMUM_SOCIAL_POST_IMAGE_COUNT = 6;


/**
 * @discription set of events that we are using in chat app
 */

export const ChatEventEnum = Object.freeze({
    CONNECTED_EVENT : "connected",
    DISCONNECTED_EVENT  : "disconnect",
    JOIN_CHAT_EVENT : "joinChat",
    LEVAVE_CHAT_EVENT : "leaveChat",
    UPDATE_SERVER_NAME_EVENT : "updateServerName",
    UPDATE_CHANNEL_NAME_EVENT : "updateChannelName",
    LEAVE_Server_EVENT : "LeaveServer",
    LEAVE_CHANNEL_EVENT : "LeaveChannel",
    MESSAGE_RECEIVED_EVENT : "messageRecieved",
    NEW_SERVER_EVENT : "newServer",
    NEW_CHAT_EVENT : "newChat",
    SOCKET_ERROR_EVENT : "socketError",
    STOP_TYPING_EVENT : "stopTyping",
    TYPING_EVENT : "typing",
    MESSAGE_DELETE_EVENT : "messageDeleted",
});
export const AvailableChatEvents = Object.values(ChatEventEnum)


export const DB_Name = "Messages"
export const DB_postgressName = "mydatabase"