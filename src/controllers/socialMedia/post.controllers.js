import mongoose from "mongoose";
import { SocialPost, Sociallike, SocialBookmark, Socialprofile ,SocialComment, SocialFollow } from "../../models/socialMedia/SocialCenter.js";
import { AvailableUserRoles, MAXIMUM_SOCIAL_POST_IMAGE_COUNT } from "../../constants.js";
import User from "../../models/auth/user.models.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {Op} from 'sequelize';
import {
  getLocalPath,
  getStaticFilePath,
  getMongoosePaginationOptions,
  removeLocalFile,
} from "../../utils/helpers.js";
import { sendNotification } from "../notification/notificaiton.controllers.js";
import { SocialFacultyprofile } from "../../models/socialMedia/SocialFacultyprofile.models.js";

const postAggregation = async (req, posts) => {
    
  try {
    const postIds = posts.map((post) => post._id.toString());
    const commentAggregation = SocialComment.aggregate([
      {
        $match: {
          postId: { $in: postIds.map((id) => new mongoose.Types.ObjectId(id)) },
        },
      },
      {
        $group: {
          _id: "$postId",
          count: { $sum: 1 },
        },
      },
    ]);
    
    const bookmarkAggregation = SocialBookmark.aggregate([
      {
        $match: {
          postId: { $in: postIds.map((id) => new mongoose.Types.ObjectId(id)) },
          bookmarkedBy: new mongoose.Types.ObjectId(req.user?._id),
        },
      },
      {
        $group: {
          _id: "$postId",
          count: { $sum: 1 },
        },
      },
    ]);
  
    const commentsMap = (await commentAggregation).reduce((map, comment) => {
      map[comment._id.toString()] = comment.count;
      return map;
    }, {});
  
    const bookmarkMap = (await bookmarkAggregation).reduce((map, bookmark) => {
      map[bookmark._id.toString()] = true;
      return map;
    }, {});
    
    const likes = await Sociallike.findAll({
      where: {  postId: {[Op.in] :postIds }},
      attributes: ["postId", "likedBy"],
    });
    
    const likesMap = likes.reduce((map, like) => {
      if (!map[like.postId]) {
        map[like.postId] = { count: 0, isLiked: false };
      }
      map[like.postId].count += 1;
      if (like.likedBy === req.user?.id) {
        map[like.postId].isLiked = true;
      }
      return map;
    }, {});
    
    const authorIds = posts.map((post) => post.author.toString());
    const profiles = await Socialprofile.findAll({
      where: {
        owner: {
          [Op.in] : authorIds
      },
      },
      attributes: ["owner", "firstName", "lastName"],
      include: [
        {
          model: User,
          as: "profileOwner",
          attributes: ["avatar", "univ_mail", "name"],
        },
      ],
    });
  
    const FacultyProfile = await SocialFacultyprofile.findAll({
      where : {
        owner :{
          [Op.in]:authorIds
        },
      },
      attributes : ["owner","firstName","lastName"],
      include : [
        {
          model : User,
          as : "FacultyprofileOwner",
          attributes : ["avatar","univ_mail","name"]
        }
      ]
    })
  
    profiles.push(...FacultyProfile);
    const profileMap = profiles.reduce((map, profile) => {
      map[profile.owner] = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        account: profile.profileOwner,
      };
      return map;
    }, {});
  
    const enrichedPosts = posts.map((post) => ({
      ...post,
      author: profileMap[post.author.toString()] || null,
      likes: likesMap[post._id.toString()]?.count || 0,
      isLiked: likesMap[post._id.toString()]?.isLiked || false,
      comments: commentsMap[post._id.toString()] || 0,
      isBookmarked: bookmarkMap[post._id.toString()] || false,
    }));
  
    return enrichedPosts;
  } catch (error) {
    throw new ApiError(500,"Error while fetching posts")
  }
};

const checkTaggedUser = async (tags)=>{
    const tagIds  = await User.findAll({
        where : {
            name : {[Op.in] : tags}
        },
        attributes : ['id','name',"token"],
        raw : true,
    });
    const AlltagIds = tagIds.map((tag)=> tag.id);
    if(AlltagIds === 0){
        throw new ApiError(400,"No valid users found in tags");
    }
    const isFollowee = await SocialFollow.aggregate([
        {
          $match: {
            followeeId: { $in: AlltagIds }, // Use `$in` to match `followeeId` against `AlltagIds`
          },
        },
        {
          $count: "count", // Count the number of matching documents
        },
      ]);
    return [isFollowee[0].count , tagIds];
};

const createPost = asyncHandler(async (req,res)=>{
    
    const { content, tags} = req.body;
    if(Array.isArray(tags) && tags.length > 0){
        const [checkTagged , taggedPeople] =  await checkTaggedUser(tags)
        if(!checkTagged){
            throw new ApiError(400,"No valid Usres found in tags")
        }
    }
    const images = 
    req.files.images && req.files.images?.length
    ? req.files.images.map((image)=>{
        const imageUrl = getStaticFilePath(req,image.filename);
        const imageLocalPath = getLocalPath(image.filename);
        return {
            url : imageUrl,
            localPath : imageLocalPath,
        }
    }) : [];

    const author = req.user?.id;
    const post = await SocialPost.create({
        content,
        tags : tags || [],
        author,
        images,
    });

    if(!post){
        throw new ApiError(500,"Error while creating post");
    }
    const createdPost = await SocialPost.findById(post._id).select("author");
    if(!createdPost){
        throw new ApiError(500,"Error while fetching created post");
    }
    const enrichedPosts = await postAggregation(req,[createdPost]);

    // taggedPeople.forEach((tag)=>{
    //   try {
    //     sendNotification("mention",tag.token,[req.user?.name,post._id])
    //   } catch (error) {
    //     console.log("Error while sending notification for tagged user");
    //   }
    // })
    
    const follower = await SocialFollow.find(
    {
      followeeId: req.user?.id, 
    },
    {
      followerId: 1, 
      _id: 0,      
    }
    );
    const followerIds = follower.map((f)=>f.followerId)
    if(followerIds.length > 0){
      const user = await User.findAll({
        where : {
          id : {[Op.in] : followerIds}
        },
        attributes : ['id',"name","token"]
    });
    // user.forEach((user)=>{
    //   try{
    //     sendNotification("newPost",user.token,[req.user?.name,post._id]);
    //   }catch(err){
    //     console.log("Error while sending notification for the post");
    //   }
    // });
    }
    return res.status(201).
    json(
        new ApiResponse(201,
            enrichedPosts || null,
            "Post created successfully"
        )
    );
});

const updatePost = asyncHandler(async(req,res)=>{
    const {content,tags} = req.body;
    const { postId } = req.params;

    if(Array.isArray(tags) && tags.length > 0){
        const checkTagged =  await checkTaggedUser(tags)
        if(!checkTagged){
            throw new ApiError(400,"No valid Usres found in tags")
        }
    }

    const post = await SocialPost.findOne({
        _id : new mongoose.Types.ObjectId(postId),
        author : req.user?.id,
    });
    if(!post){
        throw new ApiError(404,"Post does not exist");
    }

    let images = req.files?.images && req.files?.images?.length ? 
    req.files.images.map((image)=>{
        const imageUrl = getStaticFilePath(req,image.filename);
        const imageLocalPath = getLocalPath(image.filename);
        return {
            url : imageUrl,
            localPath : imageLocalPath,
        }
    }):[];
    
    const existedImages = post.images.length;
    const newImages = images.length;

    const totalImages = existedImages + newImages;
    
    if(totalImages > MAXIMUM_SOCIAL_POST_IMAGE_COUNT){
        images?.map((image)=> removeLocalFile(image.localPath));

        throw new ApiError(404,"Maximum" + MAXIMUM_SOCIAL_POST_IMAGE_COUNT + "images are allowed for a post. There are allready" + existedImages + "images attached to the post" );
    }
    
    images = [...post.images,...images];
    const updatedPost = await SocialPost.findByIdAndUpdate(
        new mongoose.Types.ObjectId(postId),
        {
            $set : {
                content,
                tags : tags || [],
                images
            }
        },{
            $new : true
        }
    );
    if(!updatedPost){
        throw new ApiError(500,"Error while updating post");
    }
    const enrichedPosts = await postAggregation(req,[updatedPost]);
    return res.status(200).
    json(
        new ApiResponse(200,
            enrichedPosts || null,
            "Post updated successfully"
        )
    );
});

const removePostImage = asyncHandler(async(req,res)=>{
    const { postId,imageId } = req.params;

    const post = await SocialPost.findOne({
        _id : new mongoose.Types.ObjectId(postId),
        author : req.user?.id
    });

    if(!post){
        throw new ApiError(404,"Post does not exist");
    }

    const updatePost = await SocialPost.findByIdAndUpdate(
        postId,{
            $pull : {
                images : {
                    _id : new mongoose.Types.ObjectId(imageId)
                }
            }
        },
        {
            new : true
        }
    );
    const removedImage = post.images?.find((image)=>{
        return image._id.toString() === imageId;
    })

    if(removedImage){
        removeLocalFile(removedImage.localPath);
    }

    const enrichedPost = await postAggregation(req,[updatePost]);

    return res.status(200).
    json(
        new ApiResponse(200,
            enrichedPost[0] || null,
            "Post image removed successfully"
        )
    );
});

const getAllPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const followees = await SocialFollow.aggregate([
    {
      $match: {
        followerId: String(req.user.id),
      },
    },
    {
      $project: {
        followeeId: 1,
        _id: 0,
      },
    },
  ]);

  const followeeIds = followees.map(f => f.followeeId);
  followeeIds.push(String(req.user.id));

  const paginatedPosts = await SocialPost.aggregatePaginate(
    [
      {
        $match: {
          author: { $in: followeeIds },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ],
    getMongoosePaginationOptions({
      page,
      limit,
      customLabels: {
        totalDocs: "totalPosts",
        docs: "posts",
      },
    })
  );

  if (!paginatedPosts.posts.length) {
    throw new ApiError(404, "No posts found");
  }
  const enrichedPosts = await postAggregation(req, paginatedPosts.posts);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...paginatedPosts,
        posts: enrichedPosts,
      },
      "Posts fetched successfully"
    )
  );
});


const getPostsByUsername = asyncHandler(async(req,res)=>{
    const {page = 1,limit  = 10} = req.query;
    const { username } = req.params;
    const user = await User.findOne({
        where : {
            name : username
        },
        attributes : ["id","name","univ_mail","avatar"]
    });

    if (!user) {
        throw new ApiError(
          404,
          "User with username '" + username + "' does not exist"
        );
    }
    const userId = user.id;
    const paginatedPosts = await SocialPost.aggregatePaginate(
      [
        {
            $match : {
                author : String(userId)
            }
        }
    ],
        getMongoosePaginationOptions({
            page,
            limit,
            customLabels : {
                totalDocs : "totalPosts",
                docs : "posts"
            }
        })
    );
    const enrichedPosts = await postAggregation(req,paginatedPosts.posts);
    return res.status(200).
    json(
        new ApiResponse(200,
            {
                ...paginatedPosts,
                posts : enrichedPosts
            },
            "Posts fetched successfully"
        )
    );
});

const getMyPosts = asyncHandler(async(req,res)=>{
    const {page = 1,limit = 10} = req.query;
    const paginatedPosts = await SocialPost.aggregatePaginate(
      [
        {
            $match : {
                author : String(req.user?.id)
            }
        }
    ],
        getMongoosePaginationOptions({
            page,
            limit,
            customLabels : {
                totalDocs : "totalPosts",
                docs : "posts"
            }
        })
    );
    console.log(paginatedPosts);
    const enrichedPosts = await postAggregation(req,paginatedPosts.posts);
    return res.status(200).
    json(
        new ApiResponse(200,{
            posts : enrichedPosts
        },"My posts fetched successfully")
    );
});

const getBookMarkedPosts = asyncHandler(async(req,res)=>{
    const {page = 1 , limit = 1} = req.query;
    const owner = String(req.user?.id)
    const paginatedPost = await SocialBookmark.aggregatePaginate(
      [
        {
          $match: {
            bookmarkedBy: owner,
          },
        },
        {
          $lookup: {
            from: "posts",
            localField: "postId",
            foreignField: "_id",
            as: "post",
          },
        },
        {
          $addFields: {
            post: { $first: "$post" },
          },
        },
        {
          $project: {
            _id : 0,
            post: 1,
          },
        },
        {
          $match: {
            post: { $ne: null },
          },
        },{
            $replaceRoot: {
              newRoot: "$post",
            },
          },
      ],
        getMongoosePaginationOptions({
            page,
            limit,
            customLabels : {
                totalDocs : "totalBookmarkedPosts",
                docs : "bookmarkedPosts"
            }
        })
    );
    const enrichedPost = await postAggregation(req,paginatedPost.bookmarkedPosts);
    return res.status(200).
    json(
        new ApiResponse(200,{
            posts : enrichedPost
        },"Bookmarked posts fetched successfully")
    );
});

const getPostById = asyncHandler(async(req,res)=>{
    const {postId} = req.params;
    const post = await SocialPost.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(postId)
            }
        }
    ]);
    if(!post){
        throw new ApiError(404,"Post does not exist")
    }
    const enrichedPost = await postAggregation(req,post);
    return res.status(200).
    json(
        new ApiResponse(200,
                enrichedPost,
            "post fetched successfully"
        )
    )
});

const deletePost = asyncHandler(async(req,res)=>{
    const { postId } = req.params;
    const post = await SocialPost.findOneAndDelete(
        {
            _id : postId,
            author : req.user.id
        }
    );
    if(!post){
        throw new ApiError(404,"post does not exist")
    }
     await SocialComment.deleteMany(
      {
        postId : postId
      }
    )
    await Sociallike.deleteMany({
      postId : postId
    })
    await SocialBookmark.deleteMany({
      postId : postId
    })
    const postImages = [...(post.images || [])]
    postImages.map((image)=>{
        removeLocalFile(image.localPath)
    });

    return res.status(200).json( new ApiResponse(200,{},"Post deleted successfully"));
});

const getPostsByTag = asyncHandler(async(req,res)=>{
    const { page = 1,limit = 1 } = req.query;
    const { tag } = req.params;
    const posts = await SocialPost.aggregatePaginate(
      [
        {
            $redact : {
                $cond : {
                    $in : [tag,"$tags"],
                },
                then : "$$KEEP",
                else: "$$PRUNE"
            }
        }
    ],
        getMongoosePaginationOptions({
          page,
          limit,
          customLabels: {
            totalDocs: "totalPosts",
            docs: "posts",
          },
        })
      );

    const enrichedPosts = await postAggregation(req,paginatedPost.posts);
    return res
    .status(200)
    .json(
      new ApiResponse(200,{...posts,posts : enrichedPosts}, `Posts with tag #${tag} fetched successfully`)
    );
})

const getStudentPosts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    // Fetch all users with roles "STUDENT" and "PRIVILEGED_STUDENT"
    const studentUsers = await User.findAll({
        where: {
            role: {
                [Op.in]: ["STUDENT", "PRIVILEGED_STUDENT"],
            },
        },
        attributes: ["id"], // Only fetch user IDs
    });

    if (!studentUsers.length) {
        throw new ApiError(404, "No users with the specified roles found");
    }

    // Extract user IDs
    const studentUserIds = studentUsers.map((user) => user.id);

    // Fetch posts created by these users
    const paginatedPosts = await SocialPost.aggregatePaginate(
        [
            {
                $match: {
                    author: { $in: studentUserIds.map((id) => String(id)) },
                },
            },
            {
                $sort: { createdAt: -1 }, // Sort by creation date (newest first)
            },
        ],
        getMongoosePaginationOptions({
            page,
            limit,
            customLabels: {
                totalDocs: "totalPosts",
                docs: "posts",
            },
        })
    );

    if (!paginatedPosts.posts.length) {
        throw new ApiError(404, "No posts found for users with the specified roles");
    }

    // Enrich posts with additional data (e.g., likes, comments, author details)
    const enrichedPosts = await postAggregation(req, paginatedPosts.posts);

    return res.status(200).json(
        new ApiResponse(200, {
            ...paginatedPosts,
            posts: enrichedPosts,
        }, "Posts fetched successfully")
    );
});

const getFacultyAdminAndPrivilegedPosts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    // Fetch all users with roles "FACULTY", "ADMIN", and "PRIVILEGED_STUDENT"
    const facultyAdminAndPrivilegedUsers = await User.findAll({
        where: {
            role: {
                [Op.in]: ["FACULTY", "ADMIN", "PRIVILEGED_STUDENT"],
            },
        },
        attributes: ["id"], // Only fetch user IDs
    });

    if (!facultyAdminAndPrivilegedUsers.length) {
        throw new ApiError(404, "No users with the specified roles found");
    }

    // Extract user IDs
    const userIds = facultyAdminAndPrivilegedUsers.map((user) => user.id);

    // Fetch posts created by these users
    const paginatedPosts = await SocialPost.aggregatePaginate(
        [
            {
                $match: {
                    author: { $in: userIds.map((id) => String(id)) },
                },
            },
            {
                $sort: { createdAt: -1 }, // Sort by creation date (newest first)
            },
        ],
        getMongoosePaginationOptions({
            page,
            limit,
            customLabels: {
                totalDocs: "totalPosts",
                docs: "posts",
            },
        })
    );

    if (!paginatedPosts.posts.length) {
        throw new ApiError(404, "No posts found for users with the specified roles");
    }

    // Enrich posts with additional data (e.g., likes, comments, author details)
    const enrichedPosts = await postAggregation(req, paginatedPosts.posts);

    return res.status(200).json(
        new ApiResponse(200, {
            ...paginatedPosts,
            posts: enrichedPosts,
        }, "Posts fetched successfully")
    );
});

const getPostByOwnerId = asyncHandler(async (req,res) => {
  const {adminId} = req.params
  const post = await SocialPost.aggregate([
        {
            $match : {
                author : adminId
            }
        },
        {
          $sort: {
            createdAt: -1
          }
        }
    ]);
    if(!post){
        throw new ApiError(404,"Post does not exist")
    }
    const enrichedPost = await postAggregation(req,post);
    return res.status(200).
    json(
        new ApiResponse(200,
                enrichedPost,
            "post fetched successfully"
        )
    )
})

export {
    createPost,
    updatePost,
    removePostImage,
    getAllPosts,
    getPostsByUsername,
    getMyPosts,
    getBookMarkedPosts,
    getPostById,
    deletePost,
    getPostsByTag,
    getStudentPosts,
    getFacultyAdminAndPrivilegedPosts,
    getPostByOwnerId
}