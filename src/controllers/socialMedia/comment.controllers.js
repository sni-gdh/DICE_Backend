import { SocialComment, SocialPost, Socialprofile } from '../../models/socialMedia/SocialCenter.js';
import mongoose from "mongoose";
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getMongoosePaginationOptions } from '../../utils/helpers.js';
import { Sociallike } from '../../models/socialMedia/SocialCenter.js';
import { User } from '../../models/chatapp/centeralized.models.js';
import { sendNotification } from '../notification/notificaiton.controllers.js';
import { token } from 'morgan';
import { SocialFacultyprofile } from '../../models/socialMedia/SocialFacultyprofile.models.js';

const addComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;

  const comment = await SocialComment.create({
    content,
    author: req.user?.id,
    postId,
  });
  const author = await SocialPost.findById(postId).select("author");
  const user = await User.findByPk(author.author,
    {
      attributes: [token]
    }
  )
  if(!user || !user.token){
    throw new ApiError(404,"User or token not found");
  }
  // try{
  //   // sendNotification("newComment",user.token,[req.user?.name , postId])
  // }catch(err){
  //   console.log("Error while sending notification for comment");
  // }
  return res.status(201).json(
    new ApiResponse(201, comment, "Comment added successfully")
  );
});

const getPostComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    throw new ApiError(400, "Invalid post ID");
  }

  const commentAggregation = SocialComment.aggregate([
    {
      $match: {
        postId: new mongoose.Types.ObjectId(postId),
      },
    },
  ]);

  const comments = await SocialComment.aggregatePaginate(
    commentAggregation,
    getMongoosePaginationOptions({
      page,
      limit,
      customLabels: {
        totalDocs: "totalComments",
        docs: "comments",
      },
    })
  );

  if (!comments.comments.length) {
    return res.status(404).json(new ApiResponse(404, [], "No comments found for this post"));
  }

  const commentIds = comments.comments.map((comment) => comment._id.toString());
  const authorIds = comments.comments
    .map((comment) => comment.author)
    .filter((id) => id);

  const likes = await Sociallike.findAll({
    where: { commentId: commentIds },
    attributes: ["commentId", "likedBy"],
  });

  const likesMap = likes.reduce((map, like) => {
    if (!map[like.commentId]) {
      map[like.commentId] = { count: 0, isLiked: false };
    }
    map[like.commentId].count += 1;
    if (like.likedBy === req.user?.id) {
      map[like.commentId].isLiked = true;
    }
    return map;
  }, {});

  const profiles = await Socialprofile.findAll({
    where: { owner: authorIds },
    attributes: ["owner", "firstName", "lastName"],
    include: [
      {
        model: User,
        as: "profileOwner",
        attributes: ["avatar", "univ_mail"],
      },
    ],
  });

  const Facultyprofiles = await SocialFacultyprofile.findAll({
    where: { owner: authorIds },
    attributes: ["owner", "firstName", "lastName"],
    include: [
      {
        model: User,
        as: "FacultyprofileOwner",
        attributes: ["avatar", "univ_mail"],
      },
    ],
  });
  profiles.push(...Facultyprofiles)
  const profileMap = profiles.reduce((map, profile) => {
    map[profile.owner] = {
      firstName: profile.firstName,
      lastName: profile.lastName,
      account: profile.profileOwner,
    };
    return map;
  }, {});

  const enrichedComments = comments.comments.map((comment) => ({
    ...comment,
    author: profileMap[comment.author] || null,
    likes: likesMap[comment._id]?.count || 0,
    isLiked: likesMap[comment._id]?.isLiked || false,
  }));

  return res.status(200).json(
    new ApiResponse(200, { ...comments, comments: enrichedComments }, "Post comments fetched successfully")
  );
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const deletedComment = await SocialComment.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(commentId),
    author: req.user?.id,
  });

  if (!deletedComment) {
    throw new ApiError(404, "Comment is already deleted or you are not authorized for this action");
  }

  return res.status(200).json(
    new ApiResponse(200, { deletedComment }, "Comment deleted successfully")
  );
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const updatedComment = await SocialComment.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(commentId),
      author: req.user?.id,
    },
    {
      $set: { content },
    },
    {
      new: true,
    }
  );

  if (!updatedComment) {
    throw new ApiError(404, "Comment does not exist or you are not authorized for this action");
  }

  return res.status(200).json(
    new ApiResponse(200, updatedComment, "Comment updated successfully")
  );
});

export {
  addComment,
  getPostComments,
  deleteComment,
  updateComment,
};