import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// organize.

const uplodOnCloudinary = async (localFilePath)=>{
    try {
        if(!localFilePath) return null
        //uplod the file on cloudinary
       const respone = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        //file has been successfully uploaded 
        // console.log("File is uploaded on Cloudinary ",respone.url);
        fs.unlinkSync(localFilePath);
        return respone;
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operatio got failed
        return null;
    }
}


export {uplodOnCloudinary}