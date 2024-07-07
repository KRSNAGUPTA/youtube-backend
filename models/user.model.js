import mongoose, { Schema } from "mongoose";
const userSchema = new Schema({
  userName: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  fullName: {
    type: String,
    trim: true,
    required: true,
    index: true,
  },
  avatar: {
    type: String, // cloudnary link
    lowercase: true,
  },

  password: {
    type: String,
    required: [true, "Password is required!"],
  },
  coverImage: {
    type: String,
  },
  refreshToken: {
    type: String,
  },
  watchHistory: [
    {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
  ],

  // email ,
  // fullName,
  // avatar,
  // coverImage,
  // password,
  // refreshToken
},{
    timestamps:true
});
export const User = mongoose.model("User", userSchema);
