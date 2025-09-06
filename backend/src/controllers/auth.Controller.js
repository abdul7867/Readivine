import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import logger from '../utils/logger.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/User.model.js';
// import { registerUserSchema, loginUserSchema } from '../validators/auth.validator.js';
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

// const registerUser = asyncHandler(async (req, res) => {
//   const { error } = registerUserSchema.validate(req.body);
//   if (error) {
//     throw new ApiError(400, error.details[0].message);
//   }

//   const { email, username, password } = req.body;

//   const existedUser = await User.findOne({
//     $or: [{ username }, { email }],
//   });

//   if (existedUser) {
//     throw new ApiError(409, 'User with email or username already exists');
//   }

//   const user = await User.create({
//     username: username.toLowerCase(),
//     email,
//     password,
//     avatarUrl: `https://ui-avatars.com/api/?name=${username}&background=random`,
//   });

//   const createdUser = await User.findById(user._id).select('-password -refreshToken');

//   if (!createdUser) {
//     throw new ApiError(500, 'Something went wrong while registering the user');
//   }

//   return res.status(201).json(new ApiResponse(201, createdUser, 'User registered Successfully'));
// });

// const loginUser = asyncHandler(async (req, res) => {
//   const { error } = loginUserSchema.validate(req.body);
//   if (error) {
//     throw new ApiError(400, error.details[0].message);
//   }

//   const { email, password } = req.body;
//   const user = await User.findOne({ email });

//   if (!user) {
//     throw new ApiError(404, 'User does not exist');
//   }

//   const isPasswordValid = await user.isPasswordCorrect(password);

//   if (!isPasswordValid) {
//     throw new ApiError(401, 'Invalid user credentials');
//   }

//   const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

//   const loggedInUser = await User.findById(user._id).select('-password -refreshToken');

//   const options = {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//   };

//   return res
//     .status(200)
//     .cookie('accessToken', accessToken, options)
//     .cookie('refreshToken', refreshToken, options)
//     .json(
//       new ApiResponse(
//         200,
//         {
//           user: loggedInUser,
//           accessToken,
//           refreshToken,
//         },
//         'User logged In Successfully'
//       )
//     );
// });

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

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
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
  const params = new URLSearchParams({
    client_id: githubClientId,
    scope: 'repo user:email',
    redirect_uri: process.env.GITHUB_CALLBACK_URL,
  });
  res.redirect(`${authUrl}?${params.toString()}`);
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

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    };

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
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


export { 
//     registerUser,
//     loginUser,
    logoutUser,
    redirectToGitHub, 
    handleGitHubCallback, 
    getAuthStatus 
};
