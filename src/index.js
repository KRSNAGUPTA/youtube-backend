import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "../db/dbConnection.js";

dotenv.config({
  path:'./.env'
});

connectDB().then(() => {
  const port = process.env.PORT || 8000;
  app.listen(port, () => {
    console.log(`Server started at port ${port} \nClick on http://localhost:${port}`);
  });
});
