import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import logger from '../utils/logger.js';
import { User } from '../models/User.model.js';
import axios from 'axios';

const GITHUB_API_URL = 'https://api.github.com';

/**
 * @description Helper function to create a blob, tree, and commit for the README file.
 * @param {object} options - The options for creating the commit.
 * @param {string} options.repoFullName - The full name of the repository (e.g., 'user/repo').
 * @param {string} options.readmeContent - The content of the README file.
 * @param {string} options.commitMessage - The commit message.
 * @param {string} options.baseSha - The SHA of the commit to base the new commit on.
 * @param {object} options.headers - The authorization headers for the GitHub API request.
 * @returns {Promise<string>} The SHA of the newly created commit.
 */
const createReadmeCommit = async ({ repoFullName, readmeContent, commitMessage, baseSha, headers }) => {
  // Create a blob with the README content
  const blobResponse = await axios.post(
    `${GITHUB_API_URL}/repos/${repoFullName}/git/blobs`,
    { content: readmeContent, encoding: 'utf-8' },
    { headers }
  );
  const newBlobSha = blobResponse.data.sha;

  // Create a new tree with the new README blob
  const treeResponse = await axios.post(
    `${GITHUB_API_URL}/repos/${repoFullName}/git/trees`,
    {
      base_tree: baseSha,
      tree: [{ path: 'README.md', mode: '100644', type: 'blob', sha: newBlobSha }],
    },
    { headers }
  );
  const newTreeSha = treeResponse.data.sha;

  // Create the commit
  const commitResponse = await axios.post(
    `${GITHUB_API_URL}/repos/${repoFullName}/git/commits`,
    {
      message: commitMessage,
      tree: newTreeSha,
      parents: [baseSha],
    },
    { headers }
  );

  return commitResponse.data.sha;
};

/**
 * @description Creates or updates the README.md file in the main branch.
 */
const saveReadmeToRepo = asyncHandler(async (req, res) => {
  const { repoFullName, readmeContent, commitMessage } = req.body;
  const userId = req.user?.id;

  if (!repoFullName || !readmeContent || !commitMessage) {
    throw new ApiError(400, "Repository name, README content, and commit message are required.");
  }

  const user = await User.findById(userId);
  if (!user || !user.githubAccessToken) {
    throw new ApiError(404, "User not found or GitHub token is missing.");
  }
  const githubAccessToken = user.getDecryptedAccessToken();
  const headers = { Authorization: `token ${githubAccessToken}` };

  try {
    // Get the latest commit SHA from the main branch
    const branchResponse = await axios.get(`${GITHUB_API_URL}/repos/${repoFullName}/branches/main`, { headers });
    const latestCommitSha = branchResponse.data.commit.sha;

    // Use the helper to create the new commit
    const newCommitSha = await createReadmeCommit({
      repoFullName,
      readmeContent,
      commitMessage,
      baseSha: latestCommitSha,
      headers,
    });

    // Update the main branch to point to the new commit
    await axios.patch(`${GITHUB_API_URL}/repos/${repoFullName}/git/refs/heads/main`, { sha: newCommitSha }, { headers });

    res.status(200).json(new ApiResponse(200, { commitSha: newCommitSha }, "README saved to main branch successfully."));
  } catch (error) {
    logger.error(`Error saving README to main branch for repo ${repoFullName}: ${error.message}`, { stack: error.stack, response: error.response?.data });
    throw new ApiError(500, "Failed to save README to the repository.");
  }
});

/**
 * @description Creates a new branch and saves the README.md file to it.
 */
const saveReadmeToNewBranch = asyncHandler(async (req, res) => {
  const { repoFullName, readmeContent, commitMessage, newBranchName } = req.body;
  const userId = req.user?.id;

  if (!repoFullName || !readmeContent || !commitMessage || !newBranchName) {
    throw new ApiError(400, "Repo name, content, commit message, and new branch name are required.");
  }

  const user = await User.findById(userId);
  if (!user || !user.githubAccessToken) {
    throw new ApiError(404, "User not found or GitHub token is missing.");
  }
  const githubAccessToken = user.getDecryptedAccessToken();
  const headers = { Authorization: `token ${githubAccessToken}` };

  try {
    // Get the SHA of the main branch to branch off from
    const branchResponse = await axios.get(`${GITHUB_API_URL}/repos/${repoFullName}/git/refs/heads/main`, { headers });
    const mainBranchSha = branchResponse.data.object.sha;

    // Create the new branch pointing to the main branch's SHA
    await axios.post(
      `${GITHUB_API_URL}/repos/${repoFullName}/git/refs`,
      {
        ref: `refs/heads/${newBranchName}`,
        sha: mainBranchSha,
      },
      { headers }
    );

    // Use the helper to create the new commit
    const newCommitSha = await createReadmeCommit({
      repoFullName,
      readmeContent,
      commitMessage,
      baseSha: mainBranchSha,
      headers,
    });

    // Update the NEW branch to point to our new commit
    await axios.patch(`${GITHUB_API_URL}/repos/${repoFullName}/git/refs/heads/${newBranchName}`, { sha: newCommitSha, force: true }, { headers });

    const pullRequestUrl = `https://github.com/${repoFullName}/pull/new/${newBranchName}`;

    res.status(201).json(new ApiResponse(201, { commitSha: newCommitSha, branch: newBranchName, pullRequestUrl }, "README saved to new branch successfully."));
  } catch (error) {
    logger.error(`Error saving README to new branch for repo ${repoFullName}: ${error.message}`, { stack: error.stack, response: error.response?.data });
    throw new ApiError(500, "Failed to save README to the new branch.");
  }
});


export { saveReadmeToRepo, saveReadmeToNewBranch };
