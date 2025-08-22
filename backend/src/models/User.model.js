import mongoose, { Schema } from 'mongoose';

// Define the schema for the User collection
const userSchema = new Schema(
  {
    githubId: {
      type: String,
      required: true,
      unique: true,
      index: true, // Add an index for faster lookups
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    avatarUrl: {
      type: String,
    },
    // We will store the encrypted GitHub access token here
    githubAccessToken: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

export const User = mongoose.model('User', userSchema);
