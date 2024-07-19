import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

// Seperate methord to generate Access and refresh Tokens 

const generateAccessTokenAndRefrenceToken= async(userId)=>{
    try {
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()

        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})
        
        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating tokens")
    }
}




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

const loginUser=asyncHandler(async (req,res)=>{
    //req-vody-> data
    // username or email
    //find the user
    //passwod check
    //access and refresh token
    //send Cookie

    const {username,email,password}=req.body
    console.log(email)
    if(!username&&!email){
        throw new ApiError(400,"Email or Username is required")
    }
    const user=await User.findOne({
        $or :[{username},{email}]
    })
    if(!user){
        throw new ApiError(404,"User is not present")
    }

    // User is a keyword of moongoose hence our methord can be accesed by user entity
    const isPasswordValid=await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials")
    }


    const {accessToken,refreshToken}=await generateAccessTokenAndRefrenceToken(user._id)

   const loggedInUser = User.findById(user._id).select("-password -refreshToken")

    const options={
        httpOnly:true, //Cookies can only be modified from the server not from frontend 
        secure:true,
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken)
    .cookie("refreshToken",refreshToken)
    .json(
        new ApiResponse(200,{
          // user: loggedInUser,accessToken,refreshToken
        },"User LoggedIn Successfully ")
    );
})


const logoutUser = asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )

    const options={
        httpOnly:true, //Cookies can only be modified from the server not from frontend 
        secure:true,
    }
    
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User Logged Out"))

})

const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingrefreshToken=req.cookie.refreshToken||req.body.refreshToken

    if(!incomingrefreshToken){
        throw new ApiError(401,"Unauthorised Request")
    }

    try {
        const decodedToken=jwt.verify(
            incomingrefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user=await User.findById(decodedToken._id)
    
        if(!user){
            throw new ApiError(401,"Invalid Refresh Token")
        }
    
        if(incomingrefreshToken!==user?.refreshToken){
            throw new ApiError(401,"Refresh Token is Expired or Used")
        }
    
        const options ={
            httpOnly:true,
            secured:true,
        }
    
       const {accessToken,newRefreshToken}=await generateAccessTokenAndRefrenceToken(user._id)
    
       return res
       .status(200)
       .cookie("accessToken",accessToken)
       .cookie("Refresh Token",newRefreshToken)
       .json(
        new ApiResponse(200,{accessToken,newRefreshToken},"Access Token Refreshed Successfully")
       )
    } catch (error) {
        throw new ApiError(401,error?.message||"Invalid Refersh Token")
    }
})
export {registerUser,loginUser,logoutUser,refreshAccessToken}
