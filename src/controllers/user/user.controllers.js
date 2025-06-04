import {asyncHandler} from "../../utils/asyncHandler.js"

import {ApiError} from "../../utils/ApiError.js"

import {ApiResponse} from "../../utils/ApiResponse.js"

import {AvailableUserRoles} from '../../constants.js'
import {sendNotification} from '../../controllers/notification/notificaiton.controllers.js'
import jwt from "jsonwebtoken";
import crypto from "crypto"
import {emailVerificationMailgenContent,
    forgotPasswordMailgenContent,
    ConfirmRoleMailgenContent,
    sendEmail
} from "../../utils/mail.js";

import User from "../../models/auth/user.models.js"
import {
    getLocalPath,
    getStaticFilePath,
    removeLocalFile,
  } from "../../utils/helpers.js";
  import { Op, where } from "sequelize";


const generateAceessandRefreshTokens = async (userId) => {
    try{
        const user = await User.findByPk(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
          }
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        
        user.refreshtoken = refreshToken;
        console.log("token is saved");
        await user.save();
        return {accessToken,refreshToken}

    }catch(error){
        throw new ApiError(500,"Something went wrong while generatoin tokens")
    }
}


const registerUser = asyncHandler(async (req,res) => {
    const {name,univ_mail,password,token} = Object.assign({},req.body) ;
    if(
        [name,univ_mail,password,token].some((field)=>field?.trim() === "")
    ){
        throw new ApiError(409,"All fields are required");
    }
    const existedUser = await User.findOne({
        where : {univ_mail : univ_mail},
        raw  : true
    })
    if(existedUser)
    {
        throw new ApiError(401,"User exits")
    }
    const user = await User.create({
        name,
        univ_mail,
        password,
        role:"NAN",
        token,
        isEmailVerified: false,
      });
      
    // if (!req.file?.filename) {
    //     throw new ApiError(400, "Avatar image is required");
    // }
    // // get avatar file system url and local path
    // const avatarUrl = getStaticFilePath(req, req.file?.filename);
    // const avatarLocalPath = getLocalPath(req.file?.filename);

    // await User.update(
    //     {
    //         avatar: {
    //         url: avatarUrl,
    //         localPath: avatarLocalPath,
    //         },
    //     },
    //     {
    //         where: { id: user.id },
    //     }
    //     );
    const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken();
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;
    await user.save();
    // send email verification mail to the user. ****important**********
    console.log("object1");
    await sendEmail({
        email: univ_mail,
        subject: "Please verify your email",
        mailgenContent: emailVerificationMailgenContent(
          name,
          `${req.protocol}://${req.get(
            "host"
          )}/api/v1/users/verify-email/${unHashedToken}`
        ),
      });
    //   ****************************************************************
    // ******************************ROLE APPROVAL MAIL START**********************************
    console.log("object2");
    await sendEmail({
        email: `${process.env.ADMIN_MAIL}`,
        subject: "Please approve the user role",
        mailgenContent: ConfirmRoleMailgenContent(
          `${process.env.ADMIN_NAME}`,
          `${req.protocol}://${req.get(
            "host"
          )}/api/v1/users/role-approval`
        ),
      });
    // *****************************ROLE APPROVAL MAIL END***********************************
    const createdUser = await User.findByPk(user.id, {
        attributes: { exclude: ['password', 'refreshToken', 'emailVerificationToken', 'emailVerificationExpiry'] }
      });
    if(!createdUser)
    {
        throw new ApiError(500,"Something went wrong while regestring a user")
    }
    return res.status(201).json(
        new ApiResponse(200, {user : createdUser} , "User registered sucessfully and verification email has been sent on your email.")
    )
})
// lognin user
const loginUser = asyncHandler(async (req,res) => {
    const {name,univ_mail,password} = req.body;
        if(!name && !univ_mail){
            throw new ApiError(400,"name or univ_mail is required")
        }
        const user = await User.findOne({
            where:{
                [Op.or]: [{ name : name }, { univ_mail : univ_mail }],
            },
        })
        if(!user){
            throw new ApiError(404,"User does not exist")
        }

        if(user.role === "NAN"){
            throw new ApiError(401,"User role is not approved yet");
        }

        const isPasswordValid = await user.isPasswordCorrect(password);
        if(!isPasswordValid){
            throw new ApiError(401,"Invalid user credentials")
        }
        
        const {accessToken , refreshToken} = await generateAceessandRefreshTokens(user.id)
        const logedInUser = await User.findByPk(user.id,{
            attributes :{exclude : ["password","refreshToken","emailVerificationToken","emailVerificationExpiry"]}
        })

        const options = {
            httpOnly : true,
            secure : true
        }

        return res.status(201).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(
            new ApiResponse(200,{
                user : logedInUser,accessToken,refreshToken
            },"User logged in successfully")
        )
}); 
// logout user
const logoutUser = asyncHandler(async(req,res)=>{
    // await executeQuery(`update "GroupChat"."user" set "refreshtoken" = $1 where "user_id" = $2`,[null,req.user.user_id])
    await User.update(
        { refreshtoken: '' },
        {
          where: { id: req.user.id },
          returning: true,
          plain: true,
        }
      );
      
      const updatedUser = await User.findByPk(req.user.id);
      
      if (!updatedUser) {
        throw new ApiError(500, "Something went wrong while logging out the user");
      }
    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(
        new ApiResponse(200,{},"User logged out successfully")
    )

})

// verify user email
const verifyUserEmail  = asyncHandler(async(req,res)=>{
    const {verificationToken} = req.params;
    if(!verificationToken){
        throw new ApiError(400,"Verification Token is missing")
    }
    // hash token is generated from the verification token
    let hashedToken = crypto.createHash("sha256").update(verificationToken).digest("hex");
    // const user = await executeQuery(`select "user_id" from "GroupChat"."user" where "emailVerificationToken" = $1 and "emailVerificationExpiry" = $2`,[hashedToken,Date.now()]);
    const user = await User.findOne({
        where: {
          emailVerificationToken: hashedToken,
          emailVerificationExpiry: {
            [Op.gt]: Date.now()
          }
        }
      });
    if(!user){
        throw new ApiError(400,"Token is invalid or expired");
    }
    user.emailVerificationToken = null
    user.emailVerificationExpiry = null
    user.isEmailVerified = true
    await user.save()
    
    
    // await executeQuery(`update "GroupChat"."user" set "emailVerificationToken" = $1,"emailVerificationExpiry" = $2 where "user_id" = $3`,[null,null,user[0].user_id])
    // await executeQuery(`update "GroupChat"."user" set "isEmailVerified" = $1 where "user_id" = $2`,[true,user[0].user_id])
    
    
    return res.status(200).json(
         new ApiResponse(200,{isEmailVerified : true},"Email is verified sucessfully")
    )
})
// resend email verification
const resendEmailVerification = asyncHandler(async(req,res)=>{
    const user = await User.findByPk(req.user?.id)
    // const user = await executeQuery(`select isEmailVerified,name from "GroupChat"."user" where "user_id" = $1`,[user_id]);
    if(!user){
        throw new ApiError(404,"User does not exist")
    }

    if(user.isEmailVerified){
        throw new ApiError(400,"Email is already verified")
    }


    const {unHashedToken , hashedToken , tokenExpiry} = user.generateTemporaryToken();
    user.emailVerificationToken = hashedToken;
    user.emailVerificationTokenExpiry = tokenExpiry;
    await user.save()
    // await executeQuery(`update "GroupChat"."user" set "emailVerificationToken" = $1,"emailVerificationExpiry" = $2 where "user_id" = $3`,[emailVerificationToken,emailVerificationTokenExpiry,user_id])
    
    // send email verification mail to the user. ****important**********
    await sendEmail({
        email: user.univ_mail,
        subject: "Please verify your email",
        mailgenContent: emailVerificationMailgenContent(
          user.name,
          `${req.protocol}://${req.get(
            "host"
          )}/api/v1/users/verify-email/${unHashedToken}`
        ),
      });

    return res.status(200).json(
        new ApiResponse(200,{},"Email verification mail sent successfully")
    )
})
// refresh access token
const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request") 
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        )
        const user = await User.findByPk(decodedToken?.id,{
            attributes:["id","refreshtoken"]
        })
        // const user = await executeQuery(`select "user_id","refreshtoken" from "GroupChat"."user" where "user_id" = $1`,[decodedToken?._id])
        if(!user){
            throw new ApiError(401,"Invalid refresh token") 
        }
        if(incomingRefreshToken !== user?.refreshtoken){
            throw new ApiError(401,"Refresh token is expired or used")
        }
        const options = {
            httpOnly : true,
            secure : true
        }
        const {accessToken,refreshToken: newRefreshToken}  = await generateAceessandRefreshTokens(user.id)
        
        user.refreshToken = newRefreshToken;
        user.save();
        
        return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",newRefreshToken,options).json(
            new ApiResponse(
                200,
                {accessToken, refreshToken : newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh Token")
    }
})
//delete user, update user profile, 
// forget password request
const forgotPasswordRequest = asyncHandler(async(req,res)=>{
    const {univ_mail} = req.body;
    const user = await User.findOne({
        where : {univ_mail : univ_mail}
    })
    // const user = await executeQuery(`select "name","user_id" from "GroupChat"."user" where "univ_mail" = $1`,[univ_mail]);
    if(!user){
        throw new ApiError(404,"User does not Exist",[])
    }

    const {unHashedToken,hashedToken,tokenExpiry} = 
        user.generateTemporaryToken();
    user.forgotPasswordToken = hashedToken;
    user.forgotPasswordExpiry = tokenExpiry;
    user.save();
    console.log(unHashedToken);
    // await executeQuery(`update "GroupChat"."user" set "forgotPasswordToken" = $1,"forgotPasswordExpiry" = $2 where "user_id" = $3`,[forgotPasswordToken,forgotPasswordExpiry,user[0].user_id])

    await sendEmail({
        email:univ_mail,
        subject: "Password reset request",
        mailgenContent: forgotPasswordMailgenContent(
          user.name,
          // ! NOTE: Following link should be the link of the frontend page responsible to request password reset
          // ! Frontend will send the below token with the new password in the request body to the backend reset password endpoint
          `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`
        ),
      });

      return res.status(200).json(
        new ApiResponse(200,{},"Password reset mail has been sent on your mail id")
      )
})
// reset forgotten Password
const resetForgottenPassword = asyncHandler(async(req,res) =>{
    const {resetToken} = req.params;
    const {newPassword} = req.body;
    // const encryptedPassword = await hashPassword(newPassword);
    // the reset token is hashed which was sent at the time of forget password request
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    // const user = await executeQuery(`select "user_id" from "GroupChat"."user" where "forgotPasswordToken"=$1 and "forgotPasswordExpiry"=$2`,[hashedToken,Date.now()]);
    const user = await User.findOne({
        where : {forgotPasswordToken : hashedToken ,
            forgotPasswordExpiry :{
                [Op.gt] : Date.now()
            } 
        },
    })
    if(!user)
    {
        throw new ApiError(400,"Token is invalid or expired")
    }
    
    // await executeQuery(`update "GroupChat"."user" set "password","forgotPasswordToken"=$1,"forgotPasswordExpiry"=$2 where "user_id" = $3`,[encryptedPassword,null,null,user[0].user_id]);
    user.forgotPasswordToken = null;
    user.forgotPasswordExpiry = null;

    user.password = newPassword
    user.save();

    return res.status(200).json(
        new ApiResponse(200,{},"Password reset successfully")
    )
})
// changePassword 
const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} = req.body;
    // const user  = await executeQuery(`select * from "GroupChat"."user" where "user_id" = $1`,[req.user?.user_id])
    const user = await User.findByPk(req.user?.id)
    
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    
    if(!isPasswordCorrect)
    {
        throw new ApiError(400 , "Invalid old password")
    }

    user.password = newPassword;
    user.save();

    // await executeQuery(`update "GroupChat"."user" set "password" = $1,"update_at" = $2 where "user_id" = $3`,[user[0].password,updated_at,user[0].user_id])
    
    return res.status(200).json(
        new ApiResponse(200,{},"Password changed successfully")
    )
})
// getcurrentUSer
const getCurrentUser =  asyncHandler(async(req,res)=>{
    return res.status(200).json(
        200,req.user,"Current user fetched successfully"
    )
})
// update user account details
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { name, univ_mail, program, course, section, join_year } = req.body;
  
    const user = await User.findByPk(req.user?.id);
  
    if (!user) {
      throw new ApiError(404, "User not found");
    }
  
    // Update only the fields that are provided in the request body
    if (name) user.name = name;
    if (univ_mail) user.univ_mail = univ_mail;
    if (program) user.program = program;
    if (course) user.course = course;
    if (section) user.section = section;
    if (join_year) user.join_year = join_year;
  
    await user.save();
  
    const updatedUser = await User.findByPk(req.user?.id, {
      attributes: { exclude: ["password", "refreshToken", "emailVerificationToken", "emailVerificationExpiry"] },
    });
  
    return res.status(200).json(
      new ApiResponse(200, updatedUser, "Account details updated successfully")
    );
  });
  
// file update todo : check the update file with helper file.
const updateUserAvatar = asyncHandler(async (req, res) => {
    // Check if user has uploaded an avatar
    if (!req.file?.filename) {
      throw new ApiError(400, "Avatar image is required");
    }
  
    // get avatar file system url and local path
    const avatarUrl = getStaticFilePath(req, req.file?.filename);
    const avatarLocalPath = getLocalPath(req.file?.filename);
  
    const user = await User.findByPk(req.user.id);
    if (!user) {
        throw new ApiError(404, "User not found");
      }
    await User.update(
        {
          avatar: {
            url: avatarUrl,
            localPath: avatarLocalPath,
          },
        },
        {
          where: { id: req.user.id },
        }
      );

    const updatedUser = await User.findByPk(req.user.id, {
    attributes: { exclude: ["password", "refreshToken", "emailVerificationToken", "emailVerificationExpiry"] },
    });
    
    // remove the old avatar
    removeLocalFile(user.avatar.localPath);
    return res
      .status(200)
      .json(new ApiResponse(200, updatedUser, "Avatar updated successfully"));
  });

  const getAppliedUserList = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
  
    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.max(parseInt(limit, 10) || 10, 1);
  
    const offset = (pageNumber - 1) * limitNumber;
  
    const { count, rows: users } = await User.findAndCountAll({
      where: { role: "NAN" }, // Make sure this value is valid
      attributes: {
        exclude: [
          "password",
          "refreshToken",
          "emailVerificationToken",
          "emailVerificationExpiry",
          "isEmailVerified",
          "forgotPasswordToken",
          "forgotPasswordExpiry",
          "token",
        ],
      },
      limit: limitNumber,
      offset: offset,
      order: [["createdAt", "DESC"]],
    });
  
    if (!count) {
      throw new ApiError(404, "No users found");
    }
  
    const totalPages = Math.ceil(count / limitNumber);
  
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          totalItems: count,
          totalPages,
          currentPage: pageNumber,
          users,
        },
        "User list fetched successfully"
      )
    );
  });
  
const approveUserRole = asyncHandler(async(req,res)=>{
        const {userId} = req.params;
        const {status} = req.body;
        
        if(!userId || !status)
        {
            throw new ApiError(400,"userId and status are required")
        }
        const user = await User.findByPk(userId);
        const NormalizeStatus = status.toUpperCase();
        if(!user){
            throw new ApiError(404,"User does not exist")
        }
        
        if(user.role !== "NAN"){
            throw new ApiError(400,"User role is already approved");
        }
        
        if(NormalizeStatus === "DELETE"){
            try {
                    //await sendNotification("REJECT",user.id, user.token, [user.name, userId]);
                    await User.destroy({
                        where: { id: userId },
                    });
                    return res.status(200)
                    .json(
                        new ApiResponse(200,{
                            approved : false
                        },"User is deleted")
                    );
                } 
            catch (error) {
                    throw new ApiError(500, "Failed to delete user or send notification");
                }
        }
        else if (Object.values(AvailableUserRoles).includes(NormalizeStatus)) {
            await User.update(
                {
                    role : NormalizeStatus
                },
                {
                    where : {
                        id : userId
                    }
                }
            )
        } else {
            throw new ApiError(400, "Invalid status");
        }
        const UpdatedUser = await User.findByPk(userId,{
            attributes : ["id","name","token","role"]
        })
        try {
            //await sendNotification("ACCEPT",user.id, UpdatedUser.token, [UpdatedUser.name, userId]);
        } catch (error) {
            console.error("Failed to send notification:", error);
            throw new ApiError(400,"Failed to send notification");
        }
        return res.status(200)
        .json(
            new ApiResponse(200,{
                UpdatedUser,
                approved : true
            },"User role is approved")
        );
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    verifyUserEmail,
    resendEmailVerification,
    forgotPasswordRequest,
    resetForgottenPassword,
    getAppliedUserList,
    approveUserRole
}