import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema({
    message_id:{
        type : mongoose.Schema.Types.ObjectId,
        ref:"message" 
    },
    user_id:{
        type : String,
        required : true 
    },
    unicode_url:{
        type : String,
        required : true
    },
    type : {
        type:String,
        required:true,
    }
},{timestamps: true});

export const reaction = mongoose.models("reaction",reactionSchema)