import axios from 'axios';
import logger from '../utils/logger.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Exchange OAuth code for access token
 * @param {string} code - OAuth authorization code
 * @returns {Promise<string>} GitHub access token
 */
export const exchangeCodeForToken = async (code) => {
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
  return access_token;
};

/**
 * Fetch GitHub user data
 * @param {string} accessToken - GitHub access token
 * @returns {Promise<Object>} GitHub user data
 */
export const fetchGitHubUser = async (accessToken) => {
  const userResponse = await axios.get('https://api.github.com/user', {
    headers: { Authorization: `token ${accessToken}` },
  });
  const githubUser = userResponse.data;

  logger.info('Successfully fetched GitHub user data', {
    githubId: githubUser.id,
    username: githubUser.login,
    hasEmail: !!githubUser.email
  });

  return githubUser;
};

/**
 * Fetch GitHub user's primary email
 * @param {string} accessToken - GitHub access token
 * @returns {Promise<string>} Primary email address
 */
export const fetchGitHubUserEmail = async (accessToken) => {
  const userEmailResponse = await axios.get('https://api.github.com/user/emails', {
    headers: { Authorization: `token ${accessToken}` },
  });

  const primaryEmail = userEmailResponse.data.find(email => email.primary)?.email;
  if (!primaryEmail) {
    logger.error('Could not fetch primary email from GitHub', {
      emailsReceived: userEmailResponse.data.length,
      emails: userEmailResponse.data.map(e => ({ email: e.email, primary: e.primary, verified: e.verified }))
    });
    throw new ApiError(400, "Could not fetch primary email from GitHub.");
  }

  logger.info('Successfully fetched primary email from GitHub', {
    email: primaryEmail
  });

  return primaryEmail;
};