import mongoose from "mongoose";
import config from "./config";

async function dbConnect() {
  try {
    await mongoose.connect(config.MONGODB_URL);
    console.log("Database connected successfully");
  } catch (error: any) {
    console.log("unable to connecte database", error);
    process.exit(1);
  }
}

export default dbConnect;
