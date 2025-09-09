import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import logger from '../utils/logger.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/User.model.js';
import axios from 'axios';

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, 'Something went wrong while generating refresh and access tokens');
  }
};

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    );

    const isProduction = process.env.NODE_ENV === 'production';
    
    const options = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-site in production
        path: '/',
        // Remove domain restriction for cross-domain cookies
    };

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const redirectToGitHub = asyncHandler(async (req, res) => {
  const githubClientId = process.env.GITHUB_CLIENT_ID;
  if (!githubClientId) {
    throw new ApiError(500, 'GitHub Client ID is not configured.');
  }
  const authUrl = 'https://github.com/login/oauth/authorize';
  const callbackURL = process.env.GITHUB_CALLBACK_URL;
  if (!callbackURL) {
    throw new ApiError(500, 'GitHub Callback URL is not configured. Please set the GITHUB_CALLBACK_URL environment variable.');
  }

  // This logging is crucial for debugging your production 404 error
  logger.info(`Using GitHub Callback URL: ${callbackURL}`);

  const params = new URLSearchParams({
    client_id: githubClientId,
    scope: 'repo user:email',
    redirect_uri: callbackURL,
  });
  const redirectUrl = `${authUrl}?${params.toString()}`;
  
  // This log confirms the final URL being used
  logger.info(`Redirecting to GitHub for authorization: ${redirectUrl}`);

  res.redirect(redirectUrl);
});

const handleGitHubCallback = asyncHandler(async (req, res) => {
  const { code } = req.query;
  if (!code) {
    throw new ApiError(400, 'Authorization failed. No code provided.');
  }

  try {
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      },
      { headers: { Accept: 'application/json' } }
    );

    const { access_token } = tokenResponse.data;
    if (!access_token) {
      throw new ApiError(500, 'Failed to retrieve access token from GitHub.');
    }

    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${access_token}` },
    });
    const githubUser = userResponse.data;

    const userEmailResponse = await axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `token ${access_token}` },
    });

    const primaryEmail = userEmailResponse.data.find(email => email.primary)?.email;
    if (!primaryEmail) {
        throw new ApiError(400, "Could not fetch primary email from GitHub.");
    }

    let user = await User.findOne({
        $or: [{ githubId: githubUser.id }, { email: primaryEmail }]
    });

    if (user) {
        // User exists, update their GitHub info and log them in
        user.githubId = githubUser.id;
        user.githubAccessToken = access_token;
        user.avatarUrl = githubUser.avatar_url;
    } else {
        // New user, create an account for them
        user = await User.create({
            githubId: githubUser.id,
            username: githubUser.login,
            email: primaryEmail,
            avatarUrl: githubUser.avatar_url,
            githubAccessToken: access_token,
        });
    }
    await user.save({ validateBeforeSave: false });

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    // Enhanced cookie options for cross-origin deployment
    const isProduction = process.env.NODE_ENV === 'production';
    const frontendUrl = process.env.FRONTEND_URL || (isProduction ? 'https://readivine.vercel.app' : 'http://localhost:5173');
    
    // For cross-domain deployment (Render backend + Vercel frontend)
    const options = {
      httpOnly: true,
      secure: isProduction, // Always secure in production
      sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-site in production
      path: '/',
      // Remove domain restriction for cross-domain cookies
      // domain is not set for cross-origin scenarios
      maxAge: isProduction ? 7 * 24 * 60 * 60 * 1000 : undefined, // 7 days in production
    };

    // Separate options for refresh token (longer expiry)
    const refreshTokenOptions = {
      ...options,
      maxAge: isProduction ? 10 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, // 10 days prod, 1 day dev
    };

    // Log for debugging in production
    if (isProduction) {
      logger.info(`Setting cookies for redirect to: ${frontendUrl}/dashboard`);
      logger.info(`Cookie options: ${JSON.stringify({ 
        secure: options.secure, 
        sameSite: options.sameSite,
        domain: options.domain,
        httpOnly: options.httpOnly,
        path: options.path,
        maxAge: options.maxAge
      }, null, 2)}`);
      logger.info(`Request Origin: ${req.get('origin') || 'No origin header'}`);
      logger.info(`User Agent: ${req.get('user-agent') || 'No user agent'}`);
    }
    
    res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, refreshTokenOptions)
    .redirect(`${frontendUrl}/dashboard`);

  } catch (error) {
    console.error('Error during GitHub callback:', error.message);
    logger.error(`Error during GitHub callback: ${error.message}`, { stack: error.stack });
    throw new ApiError(500, 'An error occurred during GitHub authentication.');
  }
});

const getAuthStatus = asyncHandler(async (req, res) => {
    // req.user is set by verifyJWT middleware
    return res
      .status(200)
      .json(new ApiResponse(200, { authenticated: true, user: req.user }, "User authenticated."));
});

const checkCookies = asyncHandler(async (req, res) => {
    // Simple endpoint to check if cookies are being received
    const cookies = req.cookies;
    const headers = req.headers;
    
    logger.info(`Cookie check - Received cookies: ${JSON.stringify(cookies)}`);
    logger.info(`Cookie check - Origin: ${headers.origin || 'No origin'}`);
    
    return res
      .status(200)
      .json(new ApiResponse(200, { 
        cookiesReceived: Object.keys(cookies),
        origin: headers.origin,
        timestamp: new Date().toISOString()
      }, "Cookie check complete."));
});


export { 
    logoutUser,
    redirectToGitHub, 
    handleGitHubCallback, 
    getAuthStatus,
    checkCookies
};
