import mongoose from "mongoose";
import { User } from "../../models/chatapp/centeralized.models.js";
import { SocialFollow, Socialprofile } from "../../models/socialMedia/SocialCenter.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getMongoosePaginationOptions } from "../../utils/helpers.js";
import { sendNotification } from "../notification/notificaiton.controllers.js";
import { Op } from "sequelize";

const followUnFollowUser = asyncHandler(async (req, res) => {
  const { toBeFollowedUserId } = req.params;
  const toBeFollowedUser = await User.findByPk(toBeFollowedUserId,{
    attributes : ['id','name',"token"]
  });
  if (!toBeFollowedUser) {
    throw new ApiError(404, "User does not exist");
  }

  if (toBeFollowedUserId.toString() === req.user.id) {
    throw new ApiError(400, "You cannot follow yourself");
  }

  const isAlreadyFollowing = await SocialFollow.findOne({
  where: {
    followerId: req.user.id,
    followeeId: toBeFollowedUser.id,
  }
});

  if (isAlreadyFollowing) {
    await SocialFollow.deleteOne({
      followerId: req.user.id,
      followeeId: toBeFollowedUser.id,
    });
    return res.status(200).json(
      new ApiResponse(200, { following: false }, "Un-followed successfully")
    );
  } else {
    await SocialFollow.create({
      followerId: req.user.id,
      followeeId: toBeFollowedUser.id,
      status :  "pending",
    });
    // try{
    //   //  sendNotification("newFollower",toBeFollowedUser.token,[toBeFollowedUser.name,req.user?.id])
    // }catch(err){
    //   console.log('Error while sending notification for new follower');
    // }
    return res.status(200).json(
      new ApiResponse(200, { following: false }, "follow request sent successfully")
    );
  }
});

const acceptAndRejectRequest = asyncHandler(async(req,res)=>{
  const {followerId} = req.params;
  const {status} = req.body; 
  if(!status || typeof status !== "string" ||(status !== "accepted" && status !== "rejected")){
    throw new ApiError(400,"Invalid status provided")
  }
  const requestStatus = await SocialFollow.findOne({
    followeeId : req.user.id,
    followerId : followerId,
  }).lean();
  if(!requestStatus){
    throw new ApiError(404,"Request not found")
  }
  if(requestStatus.status !== "pending"){
    throw new ApiError(400,"Request has been already processed")
  }
  if(status === "rejected"){
    try {
      await SocialFollow.deleteOne({
        followerId : followerId,
        followeeId : req.user.id,
      });
    
    return res.status(200).json(new ApiResponse(200,{following : false},"Request rejected successfully"));
    }
    catch (error) {
      throw new ApiError(500, "Error while rejecting the request");
    }
  }
  else{
    try {
      await SocialFollow.updateOne({
        followerId : followerId,
        followeeId : req.user.id,
      },{status : "accepted"},{new : true});
      return res.status(200).
      json(new ApiResponse(200,{following : true},"Request accepted successfully"));
    } catch (error) {
      throw new ApiError(500,"Error while accepting the request");
    }
  }
  }
);

const getListRequest = asyncHandler(async(req,res)=>{
  const { page = 1, limit = 10 } = req.query;
  try {
    const paginatedFollowers = await SocialFollow.aggregatePaginate(
      [
        {
          $match: {
          followeeId : req.user.id,
          status : "pending",
          },
        },
        {
          $project: {
            followerId: 1,
          },
        },
      ],
      getMongoosePaginationOptions({
        page,
        limit,
        customLabels: {
          totalDocs: "totalRequest",
          docs: "requesters",
        },
      })
    );
    if(!paginatedFollowers.requesters.length){
      return res.status(404).json(new ApiResponse(404,[],"No request found"))
    }
    const RequesterIds = paginatedFollowers.requesters.map((f)=> f.followerId.toString());
    
    const Requesters = await User.findAll({
      where: { id: {[Op.in] : RequesterIds}
      },
      include: [
        {
          model: Socialprofile,
          as: "profileOwner",
          attributes: ["firstName", "lastName", "bio"],
        },
      ],
      attributes: ["id", "univ_mail", "avatar"],
    });
    
  
    // Enrich followers with additional data
    const enrichedRequester = Requesters.map((requester) => ({
      ...requester.dataValues,
      profile: requester.profile || null,
    }));
  
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          totalRequest: paginatedFollowers.totalRequest,
          currentPage: page,
          totalPages: Math.ceil(paginatedFollowers.totalRequest / limit),
          Requester: enrichedRequester,
        },
        "Requester fetched successfully"
      )
    );
  } catch (error) {
    throw new ApiError(500,"Error while fetching the requesters");
  }
});

const getFollowersListByUserName = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const { page = 1, limit = 10 } = req.query;
  // Validate the username
  if (!username || typeof username !== "string") {
    throw new ApiError(400, "Invalid username");
  }

  const user = await User.findOne({
    where: { name: username.toLowerCase() },
    include: [
      {
        model: Socialprofile,
        as: "profileOwner",
        attributes: ["firstName", "lastName", "bio"],
      },
    ],
    attributes: ["id", "univ_mail", "avatar", "isEmailVerified"],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const userId = user.id;

  // Fetch followers from MongoDB

  const paginatedFollowers = await SocialFollow.aggregatePaginate(
    [
      {
        $match: {
          followeeId: String(userId),
        },
      },
      {
        $project: {
          followerId: 1,
        },
      },
    ],
    getMongoosePaginationOptions({
      page,
      limit,
      customLabels: {
        totalDocs: "totalFollowers",
        docs: "followers",
      },
    })
  );

  if (!paginatedFollowers.followers.length) {
    return res
      .status(404)
      .json(new ApiResponse(404, [], "No followers found for this user"));
  }

  const followerIds = paginatedFollowers.followers.map((f) => f.followerId.toString());

  // Fetch follower details from PostgreSQL
  const followers = await User.findAll({
    where: { id: followerIds },
    include: [
      {
        model: Socialprofile,
        as: "profileOwner",
        attributes: ["firstName", "lastName", "bio"],
      },
    ],
    attributes: ["id", "univ_mail", "avatar"],
  });
  

  // Enrich followers with additional data
  const enrichedFollowers = followers.map((follower) => ({
    ...follower.dataValues,
    profile: follower.profile,
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user,
        totalFollowers: paginatedFollowers.totalFollowers,
        currentPage: page,
        totalPages: Math.ceil(paginatedFollowers.totalFollowers / limit),
        followers: enrichedFollowers,
      },
      "Followers fetched successfully"
    )
  );
});

const getFolloweeListByUserName = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Validate the username
  if (!username || typeof username !== "string") {
    throw new ApiError(400, "Invalid username");
  }

  const user = await User.findOne({
    where: { name: username.toLowerCase() },
    include: [
      {
        model: Socialprofile,
        as: "profileOwner",
        attributes: ["firstName", "lastName", "bio"],
      },
    ],
    attributes: ["id", "univ_mail", "avatar", "isEmailVerified"],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const userId = user.id;

  // Fetch followees from MongoDB
  const followeesAggregation = SocialFollow.aggregate([
    {
      $match: {
        followerId: String(userId),
      },
    },
    {
      $project: {
        followeeId: 1,
      },
    },
  ]);

  const paginatedFollowees = await SocialFollow.aggregatePaginate(
    followeesAggregation,
    getMongoosePaginationOptions({
      page,
      limit,
      customLabels: {
        totalDocs: "totalFollowees",
        docs: "followees",
      },
    })
  );

  if (!paginatedFollowees.followees.length) {
    return res
      .status(404)
      .json(new ApiResponse(404, [], "No followees found for this user"));
  }

  const followeeIds = paginatedFollowees.followees.map((f) => f.followeeId.toString());

  // Fetch followee details from PostgreSQL
  const followees = await User.findAll({
    where: { id: followeeIds },
    include: [
      {
        model: Socialprofile,
        as: "profileOwner",
        attributes: ["firstName", "lastName", "bio"],
      },
    ],
    attributes: ["id", "univ_mail", "avatar"],
  });

  // Enrich followees with additional data
  const enrichedFollowees = followees.map((followee) => ({
    ...followee.dataValues,
    profile: followee.profile,
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user,
        totalFollowees: paginatedFollowees.totalFollowees,
        currentPage: page,
        totalPages: Math.ceil(paginatedFollowees.totalFollowees / limit),
        followees: enrichedFollowees,
      },
      "Followees fetched successfully"
    )
  );
});

const getSuggestedUsers = asyncHandler(async (req, res) => {
  const followees = await SocialFollow.aggregate([
    {
      $match: {
        followerId: String(req.user.id),
      },
    },
    {
      $project: {
        followeeId: 1,
        _id: 0
      },
    },
  ]);

  const followeeIds = followees.map(f => f.followeeId);

  followeeIds.push(req.user.id);
  const users = await User.findAll({
    where: {
      id: {
        [Op.notIn]: followeeIds,
      },
    },
    attributes: ['id', 'name', 'avatar'], 
    limit: 10,
  });

  return res.status(200).json(new ApiResponse(200, users, "Suggested users fetched"));
});


export {
  followUnFollowUser,
  acceptAndRejectRequest,
  getListRequest,
  getFollowersListByUserName,
  getFolloweeListByUserName,
  getSuggestedUsers,
};