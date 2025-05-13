import mongoose from "mongoose";

const notificationschema = new mongoose.Schema({
    user : {
        type:String,
        required:true,
    },
    type : {
        type : String,
        enum : ["MESSAGE","MENTION","COMMENT","FOLLOWER","LIKE","POST","ACCEPT","BLOCK","REJECT","REPORT"]
    },
    title:{
        type : String,
    },
    body : {
        type : String,
    },
    data : {
        type : Object
    },
    isRead:{
        type : Boolean,
        default : false
    },
},{timestamps: true})


export const notification = mongoose.model("notification",notificationschema)