import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.API_KEY,  
    api_secret: process.env.API_SECRET
});

const uploadCloudinary =async(localPath)=>{
    try {
        if (!localPath) {
            return null            
        }
        const response = await cloudinary.uploader.upload(localPath,{
            resource_type:"auto"
        })
        console.log(response.url);
        console.log("File is uploaded on cloudinary");
        return response;
    } catch (error) {
       fs.unlinkSync(localPath) 
       return null;
    }
}
export {uploadCloudinary}