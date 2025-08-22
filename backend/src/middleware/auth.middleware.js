import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/User.model.js'; // Corrected the import path if necessary


/**
 * Middleware to verify the JWT from the secure httpOnly cookie.
 * If the token is valid, it attaches the user's information to the request object.
 */
const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // 1. Extract the token directly from the cookies sent by the browser
    const token = req.cookies?.sessionToken;

    if (!token) {
      throw new ApiError(401, 'Unauthorized request: No session token provided.');
    }

    // 2. Verify the token using our secret key
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Find the user in the database based on the ID in the token
    const user = await User.findById(decodedToken?.id).select('-githubAccessToken'); // Don't select the sensitive token

    if (!user) {
      // This is a security measure: if the user in the token doesn't exist, the token is invalid.
      throw new ApiError(401, 'Invalid session. User not found.');
    }

    // 4. Attach the user object to the request for the next handlers to use
    req.user = user;
    
    next();
  } catch (error) {
    // Handle JWT errors and other issues
    throw new ApiError(401, error?.message || 'Invalid access token.');
  }
});

export { verifyJWT };
