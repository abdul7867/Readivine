import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import logger from '../utils/logger.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/User.model.js';
import { getCookieOptions, validateCookieEnvironment } from '../utils/cookieConfig.js';
import { exchangeCodeForToken, fetchGitHubUser, fetchGitHubUserEmail } from '../services/githubOAuth.js';
import { generateAccessAndRefreshTokens, findOrCreateUser } from '../services/userService.js';

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
    
    // Use centralized cookie configuration for consistency
    const accessTokenOptions = getCookieOptions(isProduction, 'access');
    const refreshTokenOptions = getCookieOptions(isProduction, 'refresh');

    // Enhanced logging for production debugging
    if (isProduction) {
        logger.info('Clearing cookies during logout', {
            userId: req.user._id,
            origin: req.get('origin') || 'No origin header',
            userAgent: req.get('user-agent') || 'No user agent'
        });
    }

    return res
    .status(200)
    .clearCookie("accessToken", accessTokenOptions)
    .clearCookie("refreshToken", refreshTokenOptions)
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
  const { code, error: oauthError, error_description } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  // Handle OAuth errors
  if (oauthError) {
    logger.error('OAuth authorization failed from GitHub', {
      error: oauthError,
      description: error_description,
      query: req.query,
      timestamp: new Date().toISOString()
    });
    
    return res.redirect(`${frontendUrl}/login?error=oauth_failed&details=${encodeURIComponent(oauthError)}`);
  }
  
  if (!code) {
    logger.error('OAuth callback failed - no code provided', {
      query: req.query,
      timestamp: new Date().toISOString()
    });
    throw new ApiError(400, 'Authorization failed. No code provided.');
  }

  // Validate cookie environment configuration
  try {
    validateCookieEnvironment();
  } catch (error) {
    logger.error('Cookie environment validation failed during OAuth callback', {
      error: error.message,
      requestInfo: {
        origin: req.get('origin'),
        referer: req.get('referer'),
        userAgent: req.get('user-agent')
      }
    });
    throw error;
  }

  try {
    // Exchange code for access token
    const accessToken = await exchangeCodeForToken(code);
    
    // Fetch GitHub user data
    const githubUser = await fetchGitHubUser(accessToken);
    
    // Fetch primary email
    const primaryEmail = await fetchGitHubUserEmail(accessToken);
    
    // Find or create user
    const user = await findOrCreateUser(githubUser, primaryEmail, accessToken);
    
    // Generate JWT tokens
    const { accessToken: jwtAccessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    logger.info('Access and refresh tokens generated successfully', {
      userId: user._id,
      hasAccessToken: !!jwtAccessToken,
      hasRefreshToken: !!refreshToken
    });

    // Environment-specific configuration
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Use centralized cookie configuration for consistency
    const accessTokenOptions = getCookieOptions(isProduction, 'access');
    const refreshTokenOptions = getCookieOptions(isProduction, 'refresh');

    // Enhanced logging for production debugging
    logger.info('OAuth callback successful - Setting cookies and redirecting', {
      userId: user._id,
      username: user.username,
      redirectUrl: `${frontendUrl}/dashboard`,
      cookieConfig: {
        accessToken: accessTokenOptions,
        refreshToken: refreshTokenOptions
      },
      timestamp: new Date().toISOString()
    });
    
    res
      .status(200)
      .cookie('accessToken', jwtAccessToken, accessTokenOptions)
      .cookie('refreshToken', refreshToken, refreshTokenOptions)
      .redirect(`${frontendUrl}/dashboard`);

  } catch (error) {
    logger.error('OAuth callback error', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    const errorType = error.response?.status === 401 ? 'auth_failed' : 'server_error';
    return res.redirect(`${frontendUrl}/login?error=${errorType}&message=${encodeURIComponent(error.message)}`);
  }
});

const getAuthStatus = asyncHandler(async (req, res) => {
    return res
      .status(200)
      .json(new ApiResponse(200, { authenticated: true, user: req.user }, "User authenticated."));
});


export { 
    logoutUser,
    redirectToGitHub, 
    handleGitHubCallback, 
    getAuthStatus
};
