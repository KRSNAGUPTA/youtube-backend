import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Error while generating Access and refresh token \n",
      error
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, username } = req.body;
  if (
    [fullName, email, password, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(409, "All fields are required!");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User already exist with username or email");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath = "";
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  let coverImage = "";
  if (coverImageLocalPath) {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
  }
  if (!avatar) {
    throw new ApiError(500, "Error while uploading Avatar");
  }

  const user = await User.create({
    username: username.toLowerCase(),
    email,
    fullName,
    avatar: avatar.url,
    coverImage: coverImage.url || "",
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -__v"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while creating user");
  }
  console.log(`\n${username} registered`);

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered Succefully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // get data
  // validate data
  // check if user exist
  // check password
  //generate refresh token & access token

  const { username, email, password } = req.body;
  if (!(username || email)) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
  const isCorrectPassword = await user.isPasswordCorrect(password);
  if (!isCorrectPassword) {
    throw new ApiError(404, "Wrong login Credential");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-refreshToken -password"
  );

  const option = [
    {
      httpOnly: true,
      secure: true,
    },
  ];

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponse(
        200,
        {
          user: accessToken,
          refreshToken,
          loggedInUser,
        },
        "User logged in Successfully"
      )
    );
});
const logoutUser = asyncHandler(async (req, res) => {
  const user = req.user;
  await User.findByIdAndUpdate(
    user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );
  const option = [
    {
      httpOnly: true,
      secure: true,
    },
  ];

  return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is invalid or has been revoked");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const cookieOptions = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, "Refresh token has expired");
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(401, "Invalid refresh token");
    }
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);

  if (!user.isCorrectPassword(oldPassword)) {
    throw new ApiError(401, "Old password is incorrect");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res.json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getUser = asyncHandler(async (req, res) => {
  return res.json(
    new ApiResponse(200, req.user, "User retrieved successfully")
  );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: { fullName, email },
      },
      { new: true, select: "-password" }
    );
    if (!user) {
      return res.status(404).json(new ApiResponse(404, null, "User not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, user, "User details updated successfully"));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, "Server error"));
  }
});

const updateAvatar = asyncHandler(async (req, res) => {
  try {
    const localAvatarPath = req.file?.path;
    if (!localAvatarPath) {
      throw new ApiError(404, "Avatar not provided");
    }

    const cloudinaryAvatarPath = await uploadOnCloudinary(localAvatarPath);
    if (!cloudinaryAvatarPath.url) {
      throw new ApiError(402, "Error while uploading Avatar on Cloudinary");
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { avatar: cloudinaryAvatarPath.url } },
      { new: true, useFindAndModify: false }
    ).select("-password");

    if (!user) {
      throw new ApiError(401, "Error while updating Avatar in DB");
    }

    return res.status(201).json(new ApiResponse(201, {}, "Avatar updated"));
  } catch (error) {
    throw new ApiError(
      400,
      error.message || "Error while updating Avatar image"
    );
  }
});

const updateCoverImage = asyncHandler(async (req, res) => {
  try {

    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
      throw new ApiError(400, "Cover image not provided");
    }

    const cloudinaryCoverImgPath = await uploadOnCloudinary(coverImageLocalPath);
    if (!cloudinaryCoverImgPath.url) {
      throw new ApiError(402, "Error while uploading cover image to Cloudinary");
    }

    const userId = req.user._id; 
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { coverImage: cloudinaryCoverImgPath.url } },
      { new: true, useFindAndModify: false }
    ).select("-password");

    if (!user) {
      throw new ApiError(404, "Error while updating cover image in DB");
    }

    return res.status(200).json(new ApiResponse(200, {}, "Cover image updated successfully"));
  } catch (error) {
    throw new ApiError(400, error.message || "Error while updating cover image");
  }
});


const removeCoverImage = asyncHandler(async (req, res) => {
  try { 
    const removed = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          coverImage: "",
        },
      },
      {
        new: true,
      }
    ).select("-password");
    if (!removed) {
      throw new ApiError(401, "Error while removing cover image");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Cover Image removed"));
  } catch (error) {
    throw new ApiError(
      400,
      error.message || "Error while removing cover image"
    );
  }
});
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getUser,
  changeCurrentPassword,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
  removeCoverImage,
};
