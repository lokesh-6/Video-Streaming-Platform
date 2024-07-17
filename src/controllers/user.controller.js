import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser= asyncHandler(async (req,res)=>{
    const {fullName,username,email,password}=req.body
    console.log("email",email)
    if(
        [fullName,email,password,username].some((field)=>
        field?.trim()==="")
    ){
        throw new ApiError(400,"fullName is required")
    }
    const existedUser=await User.findOne({
        $or:[{username},{email}]
    })

    if(existedUser){
        throw new ApiError(409,"Username / Email ALready Exists")
    }


    // middleware adds Extra fields to the response and we can access here them using req.files 

   const avatarLocalPath= req.files?.avatar[0]?.path;
   const coverImagePath =req.files?.coverImage[0]?.path;

   
    if(!avatarLocalPath){
        throw new ApiError(400 ,"Avatar file is required")
    }


    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImagePath)
    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }
    console.log(fullName,avatar.url)
    const user=await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url||"",
        email,
        password,
        username:username.toLowerCase()
    })

    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registration")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"USer Created Successfully")
    )
});


export {registerUser}
