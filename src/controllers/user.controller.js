import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { Select } from "@material-ui/core";
import { ApiResponse } from "../utils/ApiResponse.js";


const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = User.findOne(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshT0ken();

        user.refreshToken = refreshToken;
        /*  when we call the save method all the validations of user model will
            be invoked(i.e. password required etc.) but we don't want that since we have only added one extra property to use object
        */
        user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something wnet wrong while generating access and refresh tokens");
    }
}

// register the user
const registerUser = asyncHandler(async (req, res) => {
    // 1. Get data from front End
    const { userName, email, fullName, password } = req.body;
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
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
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

// login the user
const loginUser = asyncHandler(async (req, res) => {
    //1. get data from req body
    const { email, userName, password } = req.body;

    if (!email || !userName) {
        throw new ApiError(400, "User name or password is required");
    }

    // 2. Find the user
    const userExists = await User.findOne({
        $or: [{ userName }, { email }]  //find with username or email
    })

    if (!userExists) {
        throw new ApiError(400, "User does not exist. Please register yourself");
    }

    const isPasswordCorrect = await userExists.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid user credentials");
    }

    //3. Generate access and refresh token
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    //4. send it to cookies
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    /*
        by default cookies are modifieable but by doing following they can modified
        by server only 
    */
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged in successfully"
            )
        )
})


const logOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .clearCookies("accessToken", options)
        .clearCookies("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"));
})

export { registerUser, loginUser, logOutUser };