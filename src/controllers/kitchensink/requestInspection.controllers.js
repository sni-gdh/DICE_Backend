import {ApiResponse} from "../../utils/ApiResponse.js"
import {asyncHandler} from "../../utils/asyncHandler.js"

const getRequestHeaders = asyncHandler(async(req,res)=>{
    return res.status(200).json(
        new ApiResponse(200,{headers : req.headers},"Request Header returned")
    )
});

const getClientIP = asyncHandler(async(req,res)=>{
    return res.status(200).json(
        new ApiResponse(200,
            {
                ip : req.socket.remoteAddress || req.socket.localAddress,
                ipv : req.socket.remoteFamily || req.socket.localFamily,
            }
            ,"IP information is returned")
    )
})

const getUserAgent = asyncHandler(async(req,res)=>{
    return res.status(200).json(
        new ApiResponse(200,{userAgent : req.headers["user-agent"]},"user agent returned")
    )
})

const getPathVariables = asyncHandler(async(req,res)=>{
    const { pathVariable } = req.params;
    return res.status(200).json(
        new ApiResponse(200,{pathVariable},"Path variable caught successfully")
    )
})

const getQueryParameters = asyncHandler(async(req,res)=>{
    return res.status(200).josn(
        new ApiResponse(200,req.query,"Query Parameter Caught Successfully")
    )
});

export {
    getRequestHeaders,
    getClientIP,
    getUserAgent,
    getPathVariables,
    getQueryParameters,
}
