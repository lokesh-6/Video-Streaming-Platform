import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import express from 'express'




const connectDB = async()=>{
    try {
       const connectionInstance= await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB connected !! DB HOST :${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("Error DB connection ",error);
        process.exit(1) // Does it automatically
    }
}


export default connectDB;