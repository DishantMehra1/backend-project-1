import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { Select } from "@material-ui/core";
import { ApiResponse } from "../utils/ApiResponse.js";


const registerUser = asyncHandler(async (req, res) => {
    // 1. Get data from front End
    const { userName, email, fullName, password} = req.body;
    console.log("email: " + email);

    //2. Perform all the validations
    //fields validations -- check if fields are empty
    if (
        [userName, email, fullName, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // check if user already exits in DB
    const userExists = await User.findOne({
        $or: [{ userName }, { email }] // check with email or username
    })

    if (userExists) {
        throw new ApiError(409, "User already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    // validations end
    //4. Upload the files to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    //5 check if avatar is uploaded successfully to cloudinary
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    //6. If all above is successfull create entry in DB
    const user = await User.create({
        fullName,
        avatar: avatar.url, // clopudinary is sending full response but we only need url of the avatar
        coverImage: coverImage?.url || "",
        email,
        password,
        userName: userName.toLowerCase()
    })

    //7 check if user is successfully created
    const isUserCreated = await User.findById(user._id).select(
        "-password -refreshToken" // remove password & refreshToken from response to send to user
    )

    if (!isUserCreated) {
        throw new ApiError(500, "Something went wrong while registering user");
    }

    //8. Send response
    return res.status(201).json(
        new ApiResponse(200, isUserCreated, "User registred successfully")
    )
})

export { registerUser };