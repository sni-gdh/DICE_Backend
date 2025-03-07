import mongoose from "mongoose";
import { DB_Name } from "../constants.js";

export let MongodbInstance = undefined;

const connectDB = async () => {
    try{
        const  connctionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}`)
        console.log(`MongoDB connected !! DB_HOST: ${connctionInstance.connection.host}`);
    }
    catch(error){
        console.log("MongoDB connection Failed: ", error);
        process.exit(1);
    }
}

export default connectDB;