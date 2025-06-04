import mongoose from "mongoose";
import { Sociallike, SocialComment, SocialPost } from "../../models/socialMedia/SocialCenter.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {User} from '../../models/chatapp/centeralized.models.js'
import { sendNotification } from "../../controllers/notification/notificaiton.controllers.js";

const likeDislikePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const post = await SocialPost.findById(postId).select({author:1});
  const user = await User.findByPk(post.author,{
    attributes : ['name','token']
  });

  if (!post) {
    throw new ApiError(404, "Post does not exist");
  }
  const isAlreadyLiked = await Sociallike.findOne({
    where: {
      postId,
      likedBy: req.user.id,
    },
  });

  if (isAlreadyLiked) {
    await Sociallike.destroy({
      where: {
        postId,
        likedBy: req.user.id,
      },
    });
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          isLiked: false,
        },
        "Unliked successfully"
      )
    );
  } else {
    await Sociallike.create({
      postId,
      likedBy: req.user.id,
    });
    // try{
    //   sendNotification("newLike",user.token,[user.name,postId]);
    // }catch(err){
    //   console.log("Error while sending notification for post like");
    // }
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          isLiked: true,
        },
        "Liked successfully"
      )
    );
  }
});

const likeDislikeComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const comment = await SocialComment.findById(commentId).select({postId : 1});
console.log(comment);
  const author = await SocialPost.findById(comment.postId).select({author:1});
  console.log(author);
  const user = await User.findByPk(author.author,{
    attributes : ['name',"token"]
  });
  if (!comment) {
    throw new ApiError(404, "Comment does not exist");
  }
  const isAlreadyLiked = await Sociallike.findOne({
    where: {
      commentId,
      likedBy: req.user.id,
    },
  });
  if (isAlreadyLiked) {
    await Sociallike.destroy({
      where: {
        commentId,
        likedBy: req.user.id,
      },
    });
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          isLiked: false,
        },
        "Unliked successfully"
      )
    );
  } else {
    await Sociallike.create({
      commentId,
      likedBy: req.user.id,
    });
    // try{
    //   sendNotification("newLike",user.token,[user.name,commentId]);
    // }catch(err){
    //   console.log("Error while sending notification for comment like");
    // }
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          isLiked: true,
        },
        "Liked successfully"
      )
    );
  }
});

export { likeDislikePost, likeDislikeComment };