import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { generateContent } from '../services/aiService.js';
import { getTemplateById } from '../services/template.Service.js';
import { User } from '../models/User.model.js'; // 1. Import the User model
import axios from 'axios';

/**
 * @description Analyzes a GitHub repository and generates a README using a selected template.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
const analyzeRepository = asyncHandler(async (req, res) => {
  // 2. Get data from the request body and the secure user session
  const { repoFullName, templateId } = req.body;
  const userId = req.user?.id;

  if (!repoFullName) {
    throw new ApiError(400, 'Repository full name is required.');
  }
  if (!templateId) {
    throw new ApiError(400, 'A template ID is required.');
  }
  if (!userId) {
    throw new ApiError(401, "Unauthorized. User not found in session.");
  }

  // 3. Find the user in the database to get their GitHub access token
  const user = await User.findById(userId);
  if (!user || !user.githubAccessToken) {
    throw new ApiError(404, "User not found or GitHub token is missing.");
  }

  const githubAccessToken = user.githubAccessToken;

  try {
    // 4. Fetch the file structure (git tree) from the GitHub API
    const treeResponse = await axios.get(
      `https://api.github.com/repos/${repoFullName}/git/trees/main?recursive=1`,
      {
        headers: { Authorization: `token ${githubAccessToken}` },
      }
    );

    const filePaths = treeResponse.data.tree
      .filter(node => node.type === 'blob')
      .map(node => node.path);

    if (filePaths.length === 0) {
      throw new ApiError(404, "Could not find any files in the repository's main branch.");
    }

    // 5. Get the selected template's prompt and construct the final prompt
    const template = getTemplateById(templateId);
    const finalPrompt = template.prompt.replace('{filePaths}', filePaths.join('\n'));

    // 6. Call our AI service to generate the README content
    const readmeContent = await generateContent(finalPrompt, "openai/gpt-oss-20b:free");

    // 7. Send the generated content back to the frontend
    res.status(200).json(new ApiResponse(200, { readme: readmeContent }, "README generated successfully."));

  } catch (error) {
    console.error("Error during repository analysis:", error.response?.data || error.message);
    if (error.response?.status === 404) {
        throw new ApiError(404, "Repository not found or the main branch does not exist.");
    }
    if (error instanceof ApiError && error.statusCode === 404) {
        throw error;
    }
    throw new ApiError(500, "Failed to analyze the repository.");
  }
});

export { analyzeRepository };
