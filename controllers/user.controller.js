import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, username } = req.body;
  if (
    [fullName, email, password, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(409, "All fields are required!");
  }

  const existedUser = User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User already exist with username or email");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  if (!avatarLocalPath) {
    return ApiError(400, "Avatar is required");
  }

  const avatar = await uploadCloudinary(avatarLocalPath);
  const coverImage = await uploadCloudinary(coverImageLocalPath);
  if (!avatar) {
    return ApiError(500, "Error while uploading Avatar");
  }

  const user = await User.create({
    username: username.toLowerCase(),
    email,
    fullName,
    avatar: avatar.url,
    coverImage: coverImage.url || "",
    password,
  });

  const createdUser = User.findById(createdUser._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    return ApiError(500, "Something went wrong while creating user");
  }
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered Succefully"));
});

export default registerUser;
