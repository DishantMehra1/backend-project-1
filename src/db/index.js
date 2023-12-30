import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectToDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        console.log(`MongoDB connect! HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MongoDB connection failed: ", error);
    }
}

export default connectToDB;