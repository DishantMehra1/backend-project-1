import dotenv from "dotenv";

import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
import connectToDB from "./db/index.js";

dotenv.config({
    path:'./env'
})

connectToDB();