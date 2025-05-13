import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const followSchema = new Schema(
  {
    followerId: {
      type: String,
      required: true,
      default : null
    },
    followeeId: {
      type: String,
      required: true,
      default : null
    },
    status : {
      type : String,
      enum : ['pending','accepted','rejected'],
      default : 'pending'
    }
  },
  { timestamps: true }
);

followSchema.plugin(mongooseAggregatePaginate);

export const SocialFollow = mongoose.model("SocialFollow", followSchema);
