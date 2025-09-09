import { User } from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';
import logger from '../utils/logger.js';

/**
 * Generate access and refresh tokens for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Object containing accessToken and refreshToken
 */
export const generateAccessAndRefreshTokens = async (userId) => {
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

/**
 * Find or create user from GitHub data
 * @param {Object} githubUser - GitHub user data
 * @param {string} primaryEmail - Primary email address
 * @param {string} accessToken - GitHub access token
 * @returns {Promise<Object>} User document
 */
export const findOrCreateUser = async (githubUser, primaryEmail, accessToken) => {
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
    user.githubAccessToken = accessToken;
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
      githubAccessToken: accessToken,
    });
  }
  
  await user.save({ validateBeforeSave: false });

  logger.info('User data saved successfully', {
    userId: user._id,
    username: user.username
  });

  return user;
};