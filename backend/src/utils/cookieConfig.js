import logger from './logger.js';
import { ApiError } from './ApiError.js';

/**
 * Centralized cookie configuration for consistent cross-domain deployment
 * @param {boolean} isProduction - Whether the environment is production
 * @param {string} tokenType - Type of token ('access' or 'refresh')
 * @returns {Object} Cookie configuration options
 */
export const getCookieOptions = (isProduction = false, tokenType = 'access') => {
  const baseOptions = {
    httpOnly: true,
    secure: isProduction, // Always secure in production (HTTPS required)
    sameSite: isProduction ? 'none' : 'lax', // 'none' required for cross-site cookies in production
    path: '/',
    // Explicitly set domain to undefined for cross-origin scenarios
    // This allows cookies to be sent to any subdomain or different domain
    domain: undefined
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

/**
 * Validate environment configuration for cookie handling
 * @throws {ApiError} If environment configuration is invalid
 */
export const validateCookieEnvironment = () => {
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