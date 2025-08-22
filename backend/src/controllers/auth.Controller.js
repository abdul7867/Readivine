import {ApiError} from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/User.model.js';
import dotenv from "dotenv";
dotenv.config({ path: './.env' });

// We will use the 'axios' library to make HTTP requests to GitHub.
// Let's install it first: npm install axios
import axios from 'axios';
import jwt from 'jsonwebtoken';

const redirectToGitHub = asyncHandler(async (req, res) => {
  // ... (existing code is unchanged)
  const githubClientId = process.env.GITHUB_CLIENT_ID;
  if (!githubClientId) {
    throw new ApiError(500, "GitHub Client ID is not configured.");
  }
  const authUrl = 'https://github.com/login/oauth/authorize';
  const params = new URLSearchParams({
    client_id: githubClientId,
    scope: 'repo user:email',
    redirect_uri: process.env.GITHUB_CALLBACK_URL,
  });
  res.redirect(`${authUrl}?${params.toString()}`);
});

const handleGitHubCallback = asyncHandler(async (req, res) => {
  // ... (existing code is unchanged)
  const { code } = req.query;
  if (!code) {
    throw new ApiError(400, "Authorization failed. No code provided.");
  }

  try {
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      },
      { headers: { 'Accept': 'application/json' } }
    );

    const { access_token } = tokenResponse.data;
    if (!access_token) {
      throw new ApiError(500, "Failed to retrieve access token from GitHub.");
    }

    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { 'Authorization': `token ${access_token}` },
    });
    const githubUser = userResponse.data;

    const user = await User.findOneAndUpdate(
      { githubId: githubUser.id },
      {
        $set: {
          username: githubUser.login,
          avatarUrl: githubUser.avatar_url,
          githubAccessToken: access_token,
        }
      },
      { upsert: true, new: true }
    );

    const jwtPayload = { id: user._id, githubId: user.githubId, username: user.username };
    const sessionToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: '1d' });

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    };
    res.cookie('sessionToken', sessionToken, options);

    res.redirect('http://localhost:5173/dashboard');

  } catch (error) {
      if (error.response) {
    console.error("GITHUB API ERROR:", error.response.data);
  } else {
    console.error("ERROR DURING GITHUB CALLBACK:", error.message);
  }
  
    console.error("Error during GitHub callback:", error);
    throw new ApiError(500, "An error occurred during GitHub authentication.");
  }
});

// --- NEW: Logout Function ---
const logoutUser = asyncHandler(async (req, res) => {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };

  // To log out, we clear the cookie from the user's browser
  res
    .status(200)
    .clearCookie('sessionToken', options)
    .json(new ApiResponse(200, {}, "User logged out successfully."));
});


export { redirectToGitHub, handleGitHubCallback, logoutUser }; // Export the new function
