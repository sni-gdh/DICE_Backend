import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const postSchema = new Schema({
    content : {
        type : String,
        required : true,
        index : true
    },
    tags : {
        type : [String],
        default : []
    },
    images : {
        type : [
            {
                url : String,
                localPath : String
            }
        ],
        default : []
    },
    author : {
        type : String,
        required : true,
    }
},{timestamps : true});

postSchema.plugin(mongooseAggregatePaginate);
export const SocialPost = mongoose.model("post",postSchema); 