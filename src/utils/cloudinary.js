import {v2 as cloudinary} from "cloudinary"
import { response } from "express";

import fs from "fs"

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary=async (localFilePath)=>{
    try {
        if(!localFilePath) return null;
        // upload the file on cloudinary

        const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        // console.log("File is uploaded on cloudinary",response.url);
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath) //Remove the locally saved temporary file as the upload on clodinary got failed
        return null;
    }
    
}

export {uploadOnCloudinary}