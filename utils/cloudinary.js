import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.error("No file path provided");
      return null;
    }

    console.log("\nUploading file to Cloudinary from path: ", localFilePath);

    const response = await cloudinary.uploader.upload(localFilePath);

    console.log("\tFile uploaded to Cloudinary: ", response.url);

    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.error("\nError uploading file to Cloudinary:", error.message);
    console.error("Error stack:", error.stack);

    try {
      fs.unlinkSync(localFilePath);
    } catch (unlinkError) {
      console.error("Error deleting local file:", unlinkError.message);
    }

    return null;
  }
};


export { uploadOnCloudinary };
