import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/User.model.js';
import axios from 'axios';

const GITHUB_API_URL = 'https://api.github.com';

/**
 * @description Creates or updates the README.md file in the main branch.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
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
  const githubAccessToken = user.githubAccessToken;
  const headers = { Authorization: `token ${githubAccessToken}` };

  try {
    const branchResponse = await axios.get(`${GITHUB_API_URL}/repos/${repoFullName}/branches/main`, { headers });
    const latestCommitSha = branchResponse.data.commit.sha;

    const blobResponse = await axios.post(`${GITHUB_API_URL}/repos/${repoFullName}/git/blobs`, 
      { content: readmeContent, encoding: 'utf-8' }, { headers });
    const newBlobSha = blobResponse.data.sha;

    const treeResponse = await axios.post(`${GITHUB_API_URL}/repos/${repoFullName}/git/trees`, 
      {
        base_tree: latestCommitSha,
        tree: [{ path: 'README.md', mode: '100644', type: 'blob', sha: newBlobSha }],
      }, { headers });
    const newTreeSha = treeResponse.data.sha;

    const commitResponse = await axios.post(`${GITHUB_API_URL}/repos/${repoFullName}/git/commits`, 
      {
        message: commitMessage,
        tree: newTreeSha,
        parents: [latestCommitSha],
      }, { headers });
    const newCommitSha = commitResponse.data.sha;

    await axios.patch(`${GITHUB_API_URL}/repos/${repoFullName}/git/refs/heads/main`, 
      { sha: newCommitSha }, { headers });

    res.status(200).json(new ApiResponse(200, { commitSha: newCommitSha }, "README saved to main branch successfully."));

  } catch (error) {
    console.error("Error saving README to GitHub:", error.response?.data || error.message);
    throw new ApiError(500, "Failed to save README to the repository.");
  }
});


// --- NEW: Function to save README to a new branch ---
/**
 * @description Creates a new branch and saves the README.md file to it.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
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
    const githubAccessToken = user.githubAccessToken;
    const headers = { Authorization: `token ${githubAccessToken}` };

    try {
        // 1. Get the SHA of the main branch to branch off from
        const branchResponse = await axios.get(`${GITHUB_API_URL}/repos/${repoFullName}/git/refs/heads/main`, { headers });
        const mainBranchSha = branchResponse.data.object.sha;

        // 2. Create the new branch
        await axios.post(`${GITHUB_API_URL}/repos/${repoFullName}/git/refs`, {
            ref: `refs/heads/${newBranchName}`,
            sha: mainBranchSha,
        }, { headers });

        // The rest of the process is the same as saving to main, but we commit on top of the same SHA
        const blobResponse = await axios.post(`${GITHUB_API_URL}/repos/${repoFullName}/git/blobs`, 
            { content: readmeContent, encoding: 'utf-8' }, { headers });
        const newBlobSha = blobResponse.data.sha;

        const treeResponse = await axios.post(`${GITHUB_API_URL}/repos/${repoFullName}/git/trees`, 
            {
                base_tree: mainBranchSha,
                tree: [{ path: 'README.md', mode: '100644', type: 'blob', sha: newBlobSha }],
            }, { headers });
        const newTreeSha = treeResponse.data.sha;

        const commitResponse = await axios.post(`${GITHUB_API_URL}/repos/${repoFullName}/git/commits`, 
            {
                message: commitMessage,
                tree: newTreeSha,
                parents: [mainBranchSha],
            }, { headers });
        const newCommitSha = commitResponse.data.sha;

        // 3. Update the NEW branch to point to our new commit
        await axios.patch(`${GITHUB_API_URL}/repos/${repoFullName}/git/refs/heads/${newBranchName}`, 
            { sha: newCommitSha, force: true }, { headers });
        
        const pullRequestUrl = `https://github.com/${repoFullName}/pull/new/${newBranchName}`;

        res.status(201).json(new ApiResponse(201, { commitSha: newCommitSha, branch: newBranchName, pullRequestUrl }, "README saved to new branch successfully."));

    } catch (error) {
        console.error("Error saving README to new branch:", error.response?.data || error.message);
        throw new ApiError(500, "Failed to save README to the new branch.");
    }
});


export { saveReadmeToRepo, saveReadmeToNewBranch }; // Export the new function
