import {ApiResponse} from "../../utils/ApiResponse.js"
import {asyncHandler} from "../../utils/asyncHandler.js"

const getResponseHeaders = asyncHandler(async(req,res)=>{
    res.set({
        "Content-Type" : "application/json; charset=utf-8",
        "Content-Length":"280",
        etag : "12345",
    });
    return res.status(200).json(
        new ApiResponse(200,{headers : res.getHeaders() },"Response header is returnde")
    )
});


/**
 * @description "Cache-Control" is a http header use to specify browser caching policy which include how a rsource is cached, where it is cached and its maximum age
 * cacheResponseDirective =  pubic || private , public -> response can be cached by any cache
 * private -> response is a user specific ,so it can be cached only in client side device,
 */
const setCacheControlHeader = asyncHandler(async(req,res)=>{
    const {timeToLive , cacheResponseDirective} = req.params;
    res.set(
        `${cacheResponseDirective},max-age = ${timeToLive}`
    );

    return res.status(200).json(
        new ApiResponse(200,{headers : res.getHeaders()},"Cache-Control has been set")
    );

});

const sendHTMLTemplate = asyncHandler(async(req,res)=>{
    return res.status(200).set(
        "content-type","text/html"
    ).sendFile("/public/assets/templates/html_response.html",{root : "./",})
})

const sendXMLData = asyncHandler(async(req,res)=>{
    return res.status(200).set("content-type","application/xml").sendFile("/public/assets/templates/xml_response.xml",{root : "./",});
});

const sendGzipResponse = asyncHandler(async(req,res)=>{
    const animal = "tiger"
    return res.send(
        new ApiResponse(200,{
            contentEncoding : "gzip",
            string : animal.repeat(1000),
        },"Response is compressed with gzip")
    )
});

const sendBrotliResponse = asyncHandler(async(req,res)=>{
    const animal  = "tiger"
    return res.send(
        new ApiResponse(
            200,
            {
                contentEncoding : "br",
                string : animal.repeat(1000),
            },
            "Response is compressed with Brotli"
        )
    )
})


export {
    getResponseHeaders,
    setCacheControlHeader,
    sendHTMLTemplate,
    sendXMLData,
    sendGzipResponse,
    sendBrotliResponse,
  };
  