import mongoose from "mongoose";
import User from "../../models/auth/user.models.js";
import { Socialprofile } from "../../models/socialMedia/SocialCenter.js";
import { SocialFollow } from "../../models/socialMedia/SocialCenter.js";
import {SocialFacultyprofile} from '../../models/socialMedia/SocialFacultyprofile.models.js'
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const getUserSocialProfile = async (userId, req) => {
  // Fetch user details
  const user = await User.findByPk(userId);
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
  let userData = null;
  // Fetch profile details
  if(user.role === "STUDENT" || user.role === "PRIVILEGED_STUDENT"){
     userData = await Socialprofile.findOne({
      where: {
        owner: userId,
      },
      include: [
        {
          model: User,
          as: "profileOwner",
          attributes: ["univ_mail", "avatar"],
        },
      ],
    });
  }else{
     userData = await SocialFacultyprofile.findOne({
      where: {
        owner: userId,
      },
      include: [
        {
          model: User,
          as: "FacultyprofileOwner",
          attributes: ["univ_mail", "avatar"],
        },
      ],
    });
  }
  
  if (!userData) {
    throw new ApiError(404, "User profile does not exist");
  }

  // Fetch followers and following counts using Mongoose
  const socialData = await SocialFollow.aggregate([
    {
      $match: {
        $or: [
          { followerId: userId },
          { followeeId: userId },
        ],
      },
    },
    {
      $facet: {
        following: [
          { $match: { followerId: userId } },
          { $count: "count" },
        ],
        followedBy: [
          { $match: { followeeId: userId } },
          { $count: "count" },
        ],
      },
    },
  ]);

  const followersCount = socialData[0]?.followedBy?.[0]?.count || 0;
  const followingCount = socialData[0]?.following?.[0]?.count || 0;

  // Check if the logged-in user is following this user
  let isFollowing = false;
  if (req.user?.id && req.user?.id.toString() !== userId.toString()) {
    const followerInstance = await SocialFollow.findOne({
      followerId: req.user.id,
      followeeId: userId,
    });
    isFollowing = !!followerInstance;
  }

  return {
    ...userData.toJSON(),
    followersCount,
    followingCount,
    isFollowing,
  };
};

const getMySocialProfile = asyncHandler(async (req, res) => {
  const profile = await getUserSocialProfile(req.user.id, req);
  return res
    .status(200)
    .json(new ApiResponse(200, profile, "User profile fetched successfully"));
});

const getProfileByUserName = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const user = await User.findOne({
    where: { name: username },
    attributes: ["id"],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const userProfile = await getUserSocialProfile(user.id, req);

  return res
    .status(200)
    .json(
      new ApiResponse(200, userProfile, "User profile fetched successfully")
    );
});

const updateSocialProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, program,course,section,join_year,bio } = req.body;

  const [affectedRows] = await Socialprofile.update(
    {
      firstName,
      lastName,
      program,
      course,
      section,
      join_year,
      bio,
    },
    {
      where: {
        owner: req.user.id,
      },
      returning: true,
    }
  );

  if (affectedRows === 0) {
    throw new ApiError(404, "Profile does not exist. Please create a profile first.");
  }

  const profile = await getUserSocialProfile(req.user.id, req);
  return res
    .status(200)
    .json(new ApiResponse(200, profile, "User profile updated successfully"));
});

const createSocialProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName,program,course,section,join_year, bio } = req.body;
  const user = await User.findOne({
    where: {
      id: req.user.id,
    },
    attributes: ["id"],
  });

  if (!user) {
    throw new ApiError(404, "User is not registered");
  }

  const isAProfile = await Socialprofile.findOne({
    where: {
      owner: user.id,
    },
  });

  if (isAProfile) {
    throw new ApiError(400, "Profile already exists");
  }

  const profile = await Socialprofile.create({
    firstName,
    lastName,
    program,
    course,
    section,
    join_year,
    bio,
    owner: user.id,
  });

  const createdProfile = await getUserSocialProfile(user.id, req);
  console.log("object");
  return res
    .status(200)
    .json(
      new ApiResponse(200, createdProfile, "Profile created successfully")
    );
});

const createSocialProfileFacultyAndAdmin = asyncHandler(async(req,res)=>{
  try {
    const { firstName, lastName,Department,Designation, bio } = req.body;
    const user = await User.findOne({
      where: {
        id: req.user.id,
      },
      attributes: ["id"],
    });
  
    if (!user) {
      throw new ApiError(404, "User is not registered");
    }
  
    const isAProfile = await SocialFacultyprofile.findOne({
      where: {
        owner: user.id,
      },
    });
  
    if (isAProfile) {
      throw new ApiError(400, "Profile already exists");
    }
  
    const profile = await SocialFacultyprofile.create({
      firstName,
      lastName,
      Department,
      Designation,
      bio,
      owner: user.id,
    });
  
    const createdProfile = await getUserSocialProfile(user.id, req);
  
    return res
      .status(200)
      .json(
        new ApiResponse(200, createdProfile, "Profile created successfully")
      );
  } catch (error) {
      console.log(error);
  }
})


const updateFacultySocialProfile = asyncHandler(async (req, res) => {
  const {firstName, lastName, Department, Designation, bio } = req.body;

  const [affectedRows] = await SocialFacultyprofile.update(
    {
      firstName, 
      lastName, 
      Department, 
      Designation, 
      bio
    },
    {
      where: {
        owner: req.user.id,
      },
      returning: true,
    }
  );

  if (affectedRows === 0) {
    throw new ApiError(404, "Profile does not exist. Please create a profile first.");
  }

  const profile = await getUserSocialProfile(req.user.id, req);
  return res
    .status(200)
    .json(new ApiResponse(200, profile, "User profile updated successfully"));
});

export {
  getMySocialProfile,
  getProfileByUserName,
  updateSocialProfile,
  createSocialProfile,
  createSocialProfileFacultyAndAdmin,
  updateFacultySocialProfile
};