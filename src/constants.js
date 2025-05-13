/**
 * @type {{ADMIN : "ADMIN" , USER:"USER"} as const}
 * 
 */
export const RolesEnum = Object.freeze({
    STUDENT : "STUDENT",
    PRIVILEGED_STUDENT: "PRIVILEGED_STUDENT",
    FACULTY : "FACULTY",
    ADMIN : "ADMIN",
    DELETE : "DELETE"
})

export const AvailableUserRoles  = Object.values(RolesEnum);

export const PermissionsEnum = Object.freeze({
    VIEW_STUDENT_FEED : "VIEW_STUDENT_FEED",
    POST_STUDENT_FEED : "POST_STUDENT_FEED",
    POST_CAMPUS_FEED : "POST_CAMPUS_FEED",
    CREATE_COMMUNITY : "CREATE_COMMUNITY",
    ADD_TO_COMMUNITY : "ADD_TO_COMMUNITY",
});

export const AvailablePermissions = Object.values(PermissionsEnum);

/*
MAP ROLES TO THEIR PERMISSIONS
*/

export const RolePremissionsMAp = Object.freeze({
    [RolesEnum.STUDENT] : [
        PermissionsEnum.VIEW_STUDENT_FEED,
        PermissionsEnum.POST_STUDENT_FEED,
    ],
    [RolesEnum.PRIVILEGED_STUDENT] : [
        PermissionsEnum.VIEW_STUDENT_FEED,
        PermissionsEnum.POST_STUDENT_FEED,
        PermissionsEnum.POST_CAMPUS_FEED,
        PermissionsEnum.CREATE_COMMUNITY,
        PermissionsEnum.ADD_TO_COMMUNITY,
    ],
    [RolesEnum.FACULTY] : [
        PermissionsEnum.POST_STUDENT_FEED,
        PermissionsEnum.POST_CAMPUS_FEED,
        PermissionsEnum.CREATE_COMMUNITY,
        PermissionsEnum.ADD_TO_COMMUNITY,
    ],
    [RolesEnum.ADMIN]:[
        PermissionsEnum.POST_STUDENT_FEED,
        PermissionsEnum.POST_CAMPUS_FEED,
        PermissionsEnum.CREATE_COMMUNITY,
        PermissionsEnum.ADD_TO_COMMUNITY,
    ]
})
export const AvaialbleRolesWithPermissions = Object.values(RolePremissionsMAp) 

export const UserLoginType = {
    EMAIL_PASSWORD: "EMAIL_PASSWORD",
  };
  
export const AvailableSocialLogins = Object.values(UserLoginType);

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