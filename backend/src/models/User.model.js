import mongoose, { Schema } from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { encrypt, decrypt } from '../utils/crypto.js';

// Define the schema for the User collection
const userSchema = new Schema(
  {
    githubId: {
      type: String,
      unique: true,
      index: true, // Add an index for faster lookups
      sparse: true, // Allows multiple documents to have a null value for this field
    },
    username: {
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
    password: {
      type: String,
      // required: [true, 'Password is required'], // No longer required
    },
    avatarUrl: {
      type: String,
    },
    // We will store the encrypted GitHub access token here
    githubAccessToken: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

// Encrypt githubAccessToken before saving
userSchema.pre('save', function (next) {
  if (this.isModified('githubAccessToken') && this.githubAccessToken) {
    this.githubAccessToken = encrypt(this.githubAccessToken);
  }
  next();
});

userSchema.methods.getDecryptedAccessToken = function () {
  return decrypt(this.githubAccessToken);
};

// Method to generate an access token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

// Method to generate a refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model('User', userSchema);
