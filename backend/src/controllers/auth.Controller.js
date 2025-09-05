import {ApiError} from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
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

    // Enhanced cookie configuration for cross-domain compatibility
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      // Domain is automatically handled by browser in both environments
    };
    
    res.cookie('sessionToken', sessionToken, options);

    // Smart frontend URL resolution - works in both dev and prod
    const getFrontendUrl = () => {
      if (process.env.NODE_ENV === 'production') {
        if (!process.env.FRONTEND_URL) {
          throw new ApiError(500, "FRONTEND_URL environment variable is required in production");
        }
        return process.env.FRONTEND_URL;
      }
      // Development mode - flexible fallback
      return process.env.FRONTEND_URL_DEV || 'http://localhost:5173';
    };
    
    const frontendUrl = getFrontendUrl();
    console.log(`Redirecting to: ${frontendUrl}/dashboard`); // Debug logging
    
    res.redirect(`${frontendUrl}/dashboard`);

  } catch (error) {
      if (error.response) {
    console.error("GITHUB API ERROR:", error.response.data);
  } else {
    console.error("ERROR DURING GITHUB CALLBACK:", error.message);
  }
  
    console.error("Error during GitHub callback:", error);
    
    // Smart error redirection - works in both environments
    const getErrorRedirectUrl = () => {
      try {
        if (process.env.NODE_ENV === 'production') {
          return process.env.FRONTEND_URL || null;
        }
        return process.env.FRONTEND_URL_DEV || 'http://localhost:5173';
      } catch {
        return null;
      }
    };
    
    const errorRedirectUrl = getErrorRedirectUrl();
    if (errorRedirectUrl) {
      res.redirect(`${errorRedirectUrl}/login?error=auth_failed`);
    } else {
      throw new ApiError(500, "An error occurred during GitHub authentication.");
    }
  }
});

// --- NEW: Get Authentication Status Function ---
const getAuthStatus = asyncHandler(async (req, res) => {
  // req.user is set by verifyJWT middleware
  const user = {
    id: req.user.id,
    username: req.user.username,
    githubId: req.user.githubId
  };
  
  res.status(200).json(new ApiResponse(200, { user, success: true }, "Authentication status retrieved successfully."));
});

// --- NEW: Logout Function ---
const logoutUser = asyncHandler(async (req, res) => {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  };

  // To log out, we clear the cookie from the user's browser
  res
    .status(200)
    .clearCookie('sessionToken', options)
    .json(new ApiResponse(200, {}, "User logged out successfully."));
});


export { redirectToGitHub, handleGitHubCallback, logoutUser, getAuthStatus }; // Export the new function
