import mongoose, { Schema } from "mongoose";
import { SocialPost } from "./post.models.js";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const bookmarkSchema = new Schema(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref : 'posts',
      required : true
    },
    bookmarkedBy: {
      type: String,
    },
  },
  { timestamps: true }
);

bookmarkSchema.plugin(mongooseAggregatePaginate);

export const SocialBookmark = mongoose.model("SocialBookmark", bookmarkSchema);
