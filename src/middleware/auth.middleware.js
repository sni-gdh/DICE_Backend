// import { executeQuery } from "../db/postgres.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import User from "../models/auth/user.models.js";
export const verifyJWT =  asyncHandler(async(req,res,next)=> {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        if(!token){
            throw new ApiError(401,"Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findByPk(decodedToken?.id)
        if(!user){
            throw new ApiError(401,"Invalid access token")
        }
        req.user = user
        next();
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid access token")   
    }
})

/** 
*
*@discription Middleware to check logged in user for unprotected routes.
*This Middleware is only used for unsecured routes where user information is needed
*/
export const getLoggedInUserOrIgnore = asyncHandler(async(req,res,next)=>{
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer","")
    try {
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findByPk(decodedToken?.id,{
            attributes : {exclude : ['password', 'refreshToken', 'emailVerificationToken', 'emailVerificationExpiry']}
        })
        // const user = await executeQuery(`select "user_id","name","univ_mail","avatar","program","course","section","join_year","created_at","update_at" from "user" where "user_id" = $1`,[decodedToken?.user_id])
        req.user = user
        next();
    } catch (error) {
        next()
    }
});

export const verifyPermission = (roles = []) =>
    asyncHandler(async (req, res, next) => {
      if (!req.user?.id) {
        throw new ApiError(401, "Unauthorized request");
      }
      if (roles.includes(req.user?.role)) {
        next();
      } else {
        throw new ApiError(403, "You are not allowed to perform this action");
      }
    });
