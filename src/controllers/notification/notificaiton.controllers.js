import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {User} from '../../models/chatapp/centeralized.models.js';
import {firebase} from '../../firebase/firebase_admin.js';
import template from "../../utils/notify.js";
import { notification } from '../../models/notification.models.js';
const createMessage = (token, title = "Notification", body = "Notification body", data = {}) => ({
    token,
    notification: {
      title,
      body,
    },
    data,
    android: {
      priority: "high",
      clickAction: "OPEN_ACTIVITY",
    },
    apns: {
      headers: {
        "apns-priority": "10",
      },
      payload : {
        aps : {
          badge : 1,
        }
      }
    },
  });


  const saveToken = asyncHandler(async(req,res)=>{
        const {userId,token} = req.body;
        if(!userId || !token){
            throw new ApiError(400,"userId and token are required");
        }

        const user = await User.findByPk(userId);
        if(!user){
            throw new ApiError(404,"user not found");
        }
        if(user.token != token){
            user.token = token;
            await user.save();
        }
        return res.status(200).
        json(new ApiResponse(200,"token Saved Successfully"));
  })

  const sendNotification = asyncHandler(async(templateName ,userId,token,args)=>{
    if(!userId){
      throw new ApiError(400,"userId is required");
    }
    if(!args || !Array.isArray(args) || args.length < 1){
      throw new ApiError(400,"Invalid or missing arguments");
    }
    if(!templateName || !template[templateName]){
      throw new ApiError(400,"notification template not found")
    }

    if(!token){
      throw new ApiError(400,"Token is required")
    }
    try{
        const Notification = template[templateName](...args);
        const notifySave = await notification.create({
          user : userId,
          type : Notification.type,
          title : Notification.title,
          body : Notification.body,
          data : Notification.data,
        })
        if(!notifySave){
          throw new ApiError(500,"Error while saving notification")
        }
        const message = createMessage(token,Notification.title,Notification.body,Notification.data);
        const response = await firebase.messaging().send(message);
        console.log("Notification sent successfully:", response);
        return res.status(200).
        json(new ApiResponse(200,{response},"Notification sent successfully"))
    }catch(err){
        throw new ApiError(500, `Error while sending notification: ${err.message}`, err.stack);
    }
  })
export {saveToken,sendNotification}
