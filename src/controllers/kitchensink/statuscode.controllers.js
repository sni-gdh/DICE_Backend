import {ApiResponse} from "../../utils/ApiResponse.js"
import {asyncHandler} from "../../utils/asyncHandler.js"
import {ApiError} from "../../utils/ApiError.js"
import statusCodesJson from "../../json/status-codes.json" assert { type: "json" };

/**
 * @description status codes which are avoiding sending response due to their nature
 */

const CONFLICTING_STATUS_CODES = [100,102,103,204,205,304]

const getStatusCode = asyncHandler(async(req,res)=>{
    const {statusCode} = req.params;
    /**
     * @type {{statusCode : number , statusMessage : string , description : string , category : string}}
     */
    const payload = statusCodesJson[statusCode]
    if(!payload){
        throw new ApiError(404,"Invalid status Code")
    }


    return res.status(
        CONFLICTING_STATUS_CODES.includes(payload.statusCode)?200 : payload.statusCode
    ).json(
        new ApiResponse(payload.statusCode,{...payload},`${payload.statusCode} : ${payload.statusMessage}`)
    );
});

const getAllStatusCodes = asyncHandler(async(req,res)=>{
    return res.status(200).json(new ApiResponse(200,statusCodesJson,"Status Code fetched"));
});


export {
    getStatusCode,
    getAllStatusCodes
}