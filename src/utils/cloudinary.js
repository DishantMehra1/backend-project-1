import { v2 as cloudinary } from "cloudinary";
import fs from "fs"; // manage file system(read, write etc.)


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        // after file is successfully uploaded
        console.log("file is successfully uploaded on cloudinary- " + response.url);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); //remove the locally saved temporary file as the upload operation got failed
        console.log("ERROR cought while uploading file to cloudinary: " + error);
        return null;
    }
}


export { uploadOnCloudinary };
