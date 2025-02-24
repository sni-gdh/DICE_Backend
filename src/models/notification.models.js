import mongoose from "mongoose";

const notificationschema = new mongoose.Schema({
    user : {
        type:String,
        required:true,
    },
    type : {
        type : String,
        enum : ["MESSAGE","MENTION","REPLY","BLOCK","REPORT","ACCEPT","REJECT","FOLLOW"]
    },
    related_id : {
        type : String,
    },
    content:{
        type : String,
        required:true,
    },
    read:{
        type : Boolean,
        default : false
    },
    read_at:{
        type : Date
    }
},{timestamps: true})


export const notification = mongoose.models("notification",notificationschema)