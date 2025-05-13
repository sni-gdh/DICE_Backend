const template = {
    newMessage : (senderName , channelId)=>({
        type : "MESSAGE",
        title : "You have a Message",
        body : `${senderName} sent you a message`,
        data : {
            type : "message",
            channelId,
        }
    }),
    mention : (mentionedName, postId) =>({
        type :"MENTION",
        title  : "You have been mentioned",
        body : `${mentionedName} mentioned you in a post`,
        data : {
            type : "mention",
            postId,
        }
    }),
    newComment : (commenterName,postId)=>({
        type : "COMMENT",
        title : "You got a Comment",
        body  :`${commenterName} commented in your post`,
        data : {
            type : "comment",
            postId,
        }
    }),
    newFollower : (followerName,followerId)=>({
        type : "FOLLOWER",
        title : "You have a Follower",
        body : `${followerName} started following you`,
        data : {
            type  :followerName,
            followerId,
        }
    }),
    newLike : (likerName,postId)=>({
        type : "LIKE",
        title : "You got a like",
        body : `${likerName} liked your post`,
        data : {
            type : "like",
            postId,
        }
    }),
    newPost : (postName,postId)=>({
        type : "POST",
        title : "New Post",
        body : `${postName} created a new post`,
        data : {
            type : "post",
            postName,
            postId
        }
    }),
    Accept : (userName,userId)=>({
        type : "ACCEPT",
        title : "Request Accepted",
        body : `${userName} accepted your request`,
        data : {
            type : "accept",
            userId,
        }
    }),
    Reject : (userName,userId)=>({
        type : "REJECT",
        title : "Rejected",
        body : `${userName} rejected your request`,
        data : {
            type : "reject",
            userId,
        }
    }),
    Block : (userId)=>({
        type : "BLOCKED",
        title : "Blocked",
        body : `you have been blocked`,
        data : {
            type : "block",
            userId,
        }
    }),
    Report : (userId)=>({
        type : "REPORTED",
        title : "Reported",
        body : `you have been reported`,
        data : {
            type : "report",
            userId,
        }
    }),
    Banned : (userId)=>({
        type : "BANNED",
        title : "BANNED",
        body : `you have been BANNED`,
        data : {
            type : "BANNED",
            userId,
        }
    })
}
export default template;