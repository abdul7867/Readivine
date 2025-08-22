import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/readivine`);
    console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.error("MONGODB connection FAILED ", error);
    throw new ApiError(500, "Failed to connect to the database.");
  }
};

export default connectDB;
