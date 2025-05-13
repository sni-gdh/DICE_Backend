import mongoose from "mongoose";
const userModerationSchema = new mongoose.Schema({
    user:{
        type:String,
        unique:true
    },
    status : {
        type : String,
        enum : ["ACTIVE" , "BLOCKED" , "REPORTED","BANNED"],
        default : "ACTIVE"
    },
    violation_count:{
        type : Number,
        default : 0
    },
    ban_reason:
    {
        type : String
    }
},{timestamps: true})
export const userModeration = mongoose.model("userModeration",userModerationSchema)
