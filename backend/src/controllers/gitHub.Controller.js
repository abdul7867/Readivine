import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import logger from '../utils/logger.js';
import { User } from '../models/User.model.js'; // 1. Import the User model
import axios from 'axios';

/**
 * @description Fetches the authenticated user's repositories from GitHub.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
const getUserRepos = asyncHandler(async (req, res) => {
  // 2. The user's ID is now securely attached by our verifyJWT middleware
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized. User not found in session.");
  }

  // 3. Find the user in the database to get their GitHub access token
  const user = await User.findById(userId);
  if (!user || !user.githubAccessToken) {
    throw new ApiError(404, "User not found or GitHub token is missing.");
  }

  const githubAccessToken = user.getDecryptedAccessToken();

  try {
    // 4. Make the authenticated request to the GitHub API
    const response = await axios.get('https://api.github.com/user/repos', {
      headers: {
        Authorization: `token ${githubAccessToken}`,
      },
      params: {
        sort: 'updated',
        per_page: 50,
      },
    });

    const repos = response.data.map(repo => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      private: repo.private,
      url: repo.html_url,
      description: repo.description,
      language: repo.language,
      updatedAt: repo.updated_at,
    }));

    res.status(200).json(new ApiResponse(200, repos, "Repositories fetched successfully."));

  } catch (error) {
    logger.error(`Failed to fetch GitHub repos for user ${userId}: ${error.message}`, { stack: error.stack, response: error.response?.data });
    throw new ApiError(500, "Failed to fetch repositories from GitHub.");
  }
});

export { getUserRepos };
