import mongoose, { Schema } from "mongoose";

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  attachments: {
    type: [
      {
        url: String,
        localPath: String,
      },
    ], // Use Mixed type for JSONB-like behavior
    default: [],
  },
  senderId : {
    type : String,
  },
  threadId:{
    type : String,
  },
  channelId:{
    type : String,
  },
  reaction_count : {
    type : Schema.Types.ObjectId,
    ref : "reaction"
},
}, { timestamps: true });

export const Message = mongoose.model("Message", messageSchema);
  // sender: {
  //   type: Schema.Types.ObjectId,
  //   ref: "User",
  //   required: true,
  // },
  // is_edited: {
  //   type: Boolean,
  //   default: false,
  // },
  // is_deleted: {
  //   type: Boolean,
  //   default: false,
  // },
  // direct_parent_id: {
  //   type: Schema.Types.ObjectId,
  //   ref: "Message", // Reference to another message for replies
  // },
  // edited_at: {
  //   type: Date,
  // },
  // reaction_count: {
  //   type: Number,
  //   default: 0,
  // },
  // thread_id: {
  //   type: Schema.Types.ObjectId,
  //   ref: "Thread", // Reference to the parent message if this is a reply
  // },