import { validationResult } from "express-validator";
import {errorHandler} from "../middleware/error.middleware.js"
import { ApiError } from "../utils/ApiError.js";


/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * 
 * 
 * @description this is validate middleware, it is responsible  to centeralized the error checking done by express-validator
 * this checks if request validation have errors.
 * if there is error than it structures them and forward them to {@link ApiError} followed by {@link errorHandler}
 */

export const validate = (req,res,next)=>{
    const error = validationResult(req);
    if(!error.isEmpty())
    {
        return next();
    }
    const extractedErrors = []
    error.array().map((err)=>extractedErrors.push({[err.path] : err.message}));

      // 422: Unprocessable Entity
    throw new ApiError(422,"Recieved data is not valid",extractedErrors);
};