import dotenv from 'dotenv'
import connectDB from "./db/index.js";
import express from "express"
import { app } from './app.js';
dotenv.config({
    path:'./.env'
})

// Second Approach


connectDB()
.then(()=>{
    app.listen(process.env.PORT||8000,()=>{
        console.log(`Server is running on  ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("MONGO DB connection failed ",err)
})


// First Approch

// import express from 'express'
// const app = express()
// ( async()=>{
//     try {
//        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//        app.on("error",()=>{
//         console.log("Error",error);
//         throw error;
//        })
//        app.listen(process.env.PORT,()=>{
//          console.log(`App is listening on port ${process.env.PORT}`)
//        })
//     } catch (error) {
//         console.error("Error:",error)
//     }
// })()