import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import logger from '../utils/logger.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/User.model.js';
import axios from 'axios';

// Centralized cookie configuration for consistent cross-domain deployment
const getCookieOptions = (isProduction = false, tokenType = 'access') => {
  const baseOptions = {
    httpOnly: true,
    secure: isProduction, // Always secure in production (HTTPS required)
    sameSite: isProduction ? 'none' : 'lax', // 'none' required for cross-site cookies in production
    path: '/',
    // No domain restriction for cross-origin scenarios
  };

  // Different expiration times based on token type and environment
  if (tokenType === 'refresh') {
    baseOptions.maxAge = isProduction ? 10 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 10 days prod, 1 day dev
  } else {
    baseOptions.maxAge = isProduction ? 7 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000; // 7 days prod, 8 hours dev
  }

  // Enhanced logging for production debugging
  if (isProduction) {
    logger.info(`Cookie options for ${tokenType} token:`, {
      secure: baseOptions.secure,
      sameSite: baseOptions.sameSite,
      httpOnly: baseOptions.httpOnly,
      path: baseOptions.path,
      maxAge: baseOptions.maxAge,
      domain: baseOptions.domain || 'not set (cross-origin)'
    });
  }

  return baseOptions;
};

// Validate environment configuration for cookie handling
const validateCookieEnvironment = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const frontendUrl = process.env.FRONTEND_URL;
  
  if (isProduction) {
    if (!frontendUrl) {
      logger.warn('FRONTEND_URL not set in production - using default');
    }
    
    if (frontendUrl && !frontendUrl.startsWith('https://')) {
      logger.error('FRONTEND_URL must use HTTPS in production for secure cookies');
      throw new ApiError(500, 'Invalid frontend URL configuration for production');
    }
    
    logger.info('Cookie environment validation passed for production', {
      frontendUrl,
      secureMode: true,
      sameSiteMode: 'none'
    });
  } else {
    logger.info('Cookie environment validation passed for development', {
      frontendUrl: frontendUrl || 'http://localhost:5173',
      secureMode: false,
      sameSiteMode: 'lax'
    });
  }
};

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
  
  // Enhanced OAuth error logging
  if (oauthError) {
    const errorDetails = {
      error: oauthError,
      description: error_description,
      query: req.query,
      headers: {
        origin: req.get('origin'),
        referer: req.get('referer'),
        userAgent: req.get('user-agent')
      },
      timestamp: new Date().toISOString()
    };
    
    logger.error('OAuth authorization failed from GitHub', errorDetails);
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/login?error=oauth_failed&details=${encodeURIComponent(oauthError)}`);
  }
  
  if (!code) {
    const errorDetails = {
      message: 'No authorization code provided',
      query: req.query,
      headers: {
        origin: req.get('origin'),
        referer: req.get('referer'),
        userAgent: req.get('user-agent')
      },
      timestamp: new Date().toISOString()
    };
    
    logger.error('OAuth callback failed - no code provided', errorDetails);
    throw new ApiError(400, 'Authorization failed. No code provided.');
  }

  // Validate cookie environment configuration
  try {
    validateCookieEnvironment();
  } catch (error) {
    logger.error('Cookie environment validation failed during OAuth callback', {
      error: error.message,
      stack: error.stack,
      requestInfo: {
        origin: req.get('origin'),
        referer: req.get('referer'),
        userAgent: req.get('user-agent')
      }
    });
    throw error;
  }

  try {
    // Log OAuth token exchange attempt
    logger.info('Starting OAuth token exchange with GitHub', {
      hasCode: !!code,
      hasClientId: !!process.env.GITHUB_CLIENT_ID,
      hasClientSecret: !!process.env.GITHUB_CLIENT_SECRET,
      timestamp: new Date().toISOString()
    });

    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      },
      { headers: { Accept: 'application/json' } }
    );

    const { access_token, error: tokenError, error_description: tokenErrorDesc } = tokenResponse.data;
    
    if (tokenError || !access_token) {
      const errorDetails = {
        tokenError,
        tokenErrorDesc,
        responseData: tokenResponse.data,
        status: tokenResponse.status,
        timestamp: new Date().toISOString()
      };
      
      logger.error('Failed to retrieve access token from GitHub', errorDetails);
      throw new ApiError(500, `GitHub token exchange failed: ${tokenError || 'No access token received'}`);
    }

    logger.info('Successfully received access token from GitHub');

    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${access_token}` },
    });
    const githubUser = userResponse.data;

    logger.info('Successfully fetched GitHub user data', {
      githubId: githubUser.id,
      username: githubUser.login,
      hasEmail: !!githubUser.email
    });

    const userEmailResponse = await axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `token ${access_token}` },
    });

    const primaryEmail = userEmailResponse.data.find(email => email.primary)?.email;
    if (!primaryEmail) {
        logger.error('Could not fetch primary email from GitHub', {
          githubId: githubUser.id,
          username: githubUser.login,
          emailsReceived: userEmailResponse.data.length,
          emails: userEmailResponse.data.map(e => ({ email: e.email, primary: e.primary, verified: e.verified }))
        });
        throw new ApiError(400, "Could not fetch primary email from GitHub.");
    }

    logger.info('Successfully fetched primary email from GitHub', {
      email: primaryEmail,
      githubId: githubUser.id
    });

    let user = await User.findOne({
        $or: [{ githubId: githubUser.id }, { email: primaryEmail }]
    });

    if (user) {
        // User exists, update their GitHub info and log them in
        logger.info('Existing user found, updating GitHub info', {
          userId: user._id,
          existingGithubId: user.githubId,
          newGithubId: githubUser.id
        });
        
        user.githubId = githubUser.id;
        user.githubAccessToken = access_token;
        user.avatarUrl = githubUser.avatar_url;
    } else {
        // New user, create an account for them
        logger.info('Creating new user account', {
          githubId: githubUser.id,
          username: githubUser.login,
          email: primaryEmail
        });
        
        user = await User.create({
            githubId: githubUser.id,
            username: githubUser.login,
            email: primaryEmail,
            avatarUrl: githubUser.avatar_url,
            githubAccessToken: access_token,
        });
    }
    await user.save({ validateBeforeSave: false });

    logger.info('User data saved successfully', {
      userId: user._id,
      username: user.username
    });

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    logger.info('Access and refresh tokens generated successfully', {
      userId: user._id,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken
    });

    // Environment-specific configuration
    const isProduction = process.env.NODE_ENV === 'production';
    const frontendUrl = process.env.FRONTEND_URL || (isProduction ? 'https://readivine.vercel.app' : 'http://localhost:5173');
    
    // Use centralized cookie configuration for consistency
    const accessTokenOptions = getCookieOptions(isProduction, 'access');
    const refreshTokenOptions = getCookieOptions(isProduction, 'refresh');

    // Enhanced logging for production debugging
    const successLogData = {
      userId: user._id,
      username: user.username,
      redirectUrl: `${frontendUrl}/dashboard`,
      requestInfo: {
        origin: req.get('origin') || 'No origin header',
        userAgent: req.get('user-agent') || 'No user agent',
        referer: req.get('referer') || 'No referer',
        host: req.get('host'),
        protocol: req.protocol,
        secure: req.secure,
        ip: req.ip || req.connection.remoteAddress
      },
      cookieConfig: {
        accessToken: {
          secure: accessTokenOptions.secure,
          sameSite: accessTokenOptions.sameSite,
          httpOnly: accessTokenOptions.httpOnly,
          maxAge: accessTokenOptions.maxAge
        },
        refreshToken: {
          secure: refreshTokenOptions.secure,
          sameSite: refreshTokenOptions.sameSite,
          httpOnly: refreshTokenOptions.httpOnly,
          maxAge: refreshTokenOptions.maxAge
        }
      },
      timestamp: new Date().toISOString()
    };
    
    logger.info('OAuth callback successful - Setting cookies and redirecting', successLogData);
    
    res
    .status(200)
    .cookie('accessToken', accessToken, accessTokenOptions)
    .cookie('refreshToken', refreshToken, refreshTokenOptions)
    .redirect(`${frontendUrl}/dashboard`);

  } catch (error) {
    // Comprehensive error logging for OAuth callback failures
    const errorLogData = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      requestInfo: {
        query: req.query,
        headers: {
          origin: req.get('origin'),
          referer: req.get('referer'),
          userAgent: req.get('user-agent'),
          host: req.get('host'),
          cookie: req.get('cookie') ? 'Present' : 'Missing'
        },
        protocol: req.protocol,
        secure: req.secure,
        ip: req.ip || req.connection.remoteAddress
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasGithubClientId: !!process.env.GITHUB_CLIENT_ID,
        hasGithubClientSecret: !!process.env.GITHUB_CLIENT_SECRET,
        frontendUrl: process.env.FRONTEND_URL
      },
      timestamp: new Date().toISOString()
    };
    
    // Log axios-specific errors with more detail
    if (error.response) {
      errorLogData.axiosError = {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      };
    } else if (error.request) {
      errorLogData.networkError = {
        message: 'No response received from external service',
        request: error.request
      };
    }
    
    console.error('Error during GitHub callback:', error.message);
    logger.error('Comprehensive OAuth callback error', errorLogData);
    
    // Redirect to frontend with error information for user-friendly handling
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const errorType = error.response?.status === 401 ? 'auth_failed' : 'server_error';
    
    return res.redirect(`${frontendUrl}/login?error=${errorType}&message=${encodeURIComponent(error.message)}`);
  }
});

const getAuthStatus = asyncHandler(async (req, res) => {
    // req.user is set by verifyJWT middleware
    return res
      .status(200)
      .json(new ApiResponse(200, { authenticated: true, user: req.user }, "User authenticated."));
});

const checkCookies = asyncHandler(async (req, res) => {
    // Comprehensive endpoint to debug cookie and environment configuration
    const cookies = req.cookies;
    const headers = req.headers;
    const isProduction = process.env.NODE_ENV === 'production';
    
    const debugInfo = {
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isProduction,
        frontendUrl: process.env.FRONTEND_URL,
        timestamp: new Date().toISOString()
      },
      request: {
        origin: headers.origin || 'No origin header',
        referer: headers.referer || 'No referer header',
        userAgent: headers['user-agent'] || 'No user agent',
        host: headers.host || 'No host header',
        protocol: req.protocol,
        secure: req.secure,
        ip: req.ip || req.connection.remoteAddress
      },
      cookies: {
        received: Object.keys(cookies),
        accessToken: cookies.accessToken ? 'Present' : 'Missing',
        refreshToken: cookies.refreshToken ? 'Present' : 'Missing',
        rawCookieHeader: headers.cookie || 'No cookie header'
      },
      cookieConfiguration: {
        access: getCookieOptions(isProduction, 'access'),
        refresh: getCookieOptions(isProduction, 'refresh')
      }
    };
    
    logger.info('Cookie debug check performed', debugInfo);
    
    return res
      .status(200)
      .json(new ApiResponse(200, debugInfo, "Cookie debug check complete."));
});

const debugCookieConfig = asyncHandler(async (req, res) => {
    // Endpoint specifically for debugging cookie configuration in production
    const isProduction = process.env.NODE_ENV === 'production';
    
    try {
        validateCookieEnvironment();
        
        const configInfo = {
            environment: process.env.NODE_ENV,
            cookieSettings: {
                production: {
                    secure: true,
                    sameSite: 'none',
                    httpOnly: true,
                    maxAge: {
                        access: '7 days',
                        refresh: '10 days'
                    }
                },
                development: {
                    secure: false,
                    sameSite: 'lax',
                    httpOnly: true,
                    maxAge: {
                        access: '8 hours',
                        refresh: '1 day'
                    }
                }
            },
            currentConfig: {
                access: getCookieOptions(isProduction, 'access'),
                refresh: getCookieOptions(isProduction, 'refresh')
            },
            urls: {
                frontend: process.env.FRONTEND_URL,
                backend: req.protocol + '://' + req.get('host')
            }
        };
        
        return res
          .status(200)
          .json(new ApiResponse(200, configInfo, "Cookie configuration debug complete."));
          
    } catch (error) {
        logger.error('Cookie configuration validation failed', error);
        return res
          .status(500)
          .json(new ApiResponse(500, { error: error.message }, "Cookie configuration validation failed."));
    }
});

const debugOAuthFlow = asyncHandler(async (req, res) => {
    // Comprehensive OAuth flow debugging endpoint
    const isProduction = process.env.NODE_ENV === 'production';
    
    const oauthDebugInfo = {
        environment: {
            nodeEnv: process.env.NODE_ENV,
            isProduction,
            timestamp: new Date().toISOString()
        },
        configuration: {
            githubClientId: process.env.GITHUB_CLIENT_ID ? 'Configured' : 'Missing',
            githubClientSecret: process.env.GITHUB_CLIENT_SECRET ? 'Configured' : 'Missing',
            githubCallbackUrl: process.env.GITHUB_CALLBACK_URL || 'Not configured',
            frontendUrl: process.env.FRONTEND_URL || 'Not configured'
        },
        urls: {
            authUrl: 'https://github.com/login/oauth/authorize',
            tokenUrl: 'https://github.com/login/oauth/access_token',
            userApiUrl: 'https://api.github.com/user',
            emailApiUrl: 'https://api.github.com/user/emails',
            callbackUrl: process.env.GITHUB_CALLBACK_URL,
            redirectAfterAuth: (process.env.FRONTEND_URL || 'http://localhost:5173') + '/dashboard'
        },
        cookieConfiguration: {
            access: getCookieOptions(isProduction, 'access'),
            refresh: getCookieOptions(isProduction, 'refresh')
        },
        requestInfo: {
            origin: req.get('origin') || 'No origin header',
            referer: req.get('referer') || 'No referer header',
            userAgent: req.get('user-agent') || 'No user agent',
            host: req.get('host') || 'No host header',
            protocol: req.protocol,
            secure: req.secure,
            cookies: Object.keys(req.cookies || {}),
            ip: req.ip || req.connection.remoteAddress
        },
        testUrls: {
            initiateOAuth: `${req.protocol}://${req.get('host')}/auth/github`,
            checkCookies: `${req.protocol}://${req.get('host')}/auth/cookies`,
            debugConfig: `${req.protocol}://${req.get('host')}/auth/debug/config`,
            authStatus: `${req.protocol}://${req.get('host')}/auth/status`
        }
    };
    
    // Validate configuration and add warnings
    const warnings = [];
    
    if (!process.env.GITHUB_CLIENT_ID) {
        warnings.push('GITHUB_CLIENT_ID is not configured');
    }
    
    if (!process.env.GITHUB_CLIENT_SECRET) {
        warnings.push('GITHUB_CLIENT_SECRET is not configured');
    }
    
    if (!process.env.GITHUB_CALLBACK_URL) {
        warnings.push('GITHUB_CALLBACK_URL is not configured');
    }
    
    if (isProduction && (!process.env.FRONTEND_URL || !process.env.FRONTEND_URL.startsWith('https://'))) {
        warnings.push('FRONTEND_URL should be HTTPS in production');
    }
    
    if (warnings.length > 0) {
        oauthDebugInfo.warnings = warnings;
    }
    
    logger.info('OAuth flow debug check performed', oauthDebugInfo);
    
    return res
      .status(200)
      .json(new ApiResponse(200, oauthDebugInfo, "OAuth flow debug check complete."));
});


export { 
    logoutUser,
    redirectToGitHub, 
    handleGitHubCallback, 
    getAuthStatus,
    checkCookies,
    debugCookieConfig,
    debugOAuthFlow
};
