import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema({
    file_url:{
        type:String,
        required:true
    },
    message_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref : "message",
    },
    file_type:{
        type:String,
        required:true
    },
    file_size:{
        type: Number,
        required:true
    },
    file_name:{
        type:String,
        required:true
    }
},{timestamps: true})

export const attachment = mongoose.models("attachment",attachmentSchema)