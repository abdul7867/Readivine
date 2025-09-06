import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Readme } from '../models/Readme.model.js';
import mongoose from 'mongoose';

// ... (getReadme, saveReadme, deleteReadme functions are unchanged)
const getReadme = asyncHandler(async (req, res) => {
  const { repoFullName } = req.query;
  const userId = req.user?._id;

  if (!repoFullName) {
    throw new ApiError(400, "Repository full name is required.");
  }

  const readme = await Readme.findOne({
    repoFullName,
    owner: userId,
  });

  if (!readme) {
    throw new ApiError(404, "No saved README found for this repository.");
  }

  return res.status(200).json(new ApiResponse(200, readme, "README draft fetched successfully."));
});

const saveReadme = asyncHandler(async (req, res) => {
  const { repoFullName, content } = req.body;
  const userId = req.user?._id;

  if (!repoFullName || !content) {
    throw new ApiError(400, "Repository name and content are required.");
  }

  const readme = await Readme.findOneAndUpdate(
    {
      repoFullName,
      owner: userId,
    },
    {
      $set: { content },
    },
    {
      new: true,
      upsert: true,
    }
  );

  return res.status(201).json(new ApiResponse(201, readme, "README draft saved successfully."));
});

const deleteReadme = asyncHandler(async (req, res) => {
    const { repoFullName } = req.body;
    const userId = req.user?._id;

    if (!repoFullName) {
        throw new ApiError(400, "Repository full name is required.");
    }

    const result = await Readme.deleteOne({
        repoFullName,
        owner: userId,
    });

    if (result.deletedCount === 0) {
        throw new ApiError(404, "No saved README found to delete.");
    }

    return res.status(200).json(new ApiResponse(200, {}, "README draft deleted successfully."));
});


// --- NEW: Function to check status of multiple drafts ---
/**
 * @description Checks which of the provided repositories have a saved draft.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
const checkDraftsStatus = asyncHandler(async (req, res) => {
    const { repoFullNames } = req.body; // Expect an array of repo names
    const userId = req.user?._id;

    if (!Array.isArray(repoFullNames)) {
        throw new ApiError(400, "repoFullNames must be an array.");
    }

    // Find all drafts that match the owner and are in the provided list of repos
    const foundDrafts = await Readme.find({
        owner: userId,
        repoFullName: { $in: repoFullNames }
    }).select('repoFullName'); // Only select the repo name field

    // Return just an array of the names of repos that have drafts
    const reposWithDrafts = foundDrafts.map(draft => draft.repoFullName);

    return res.status(200).json(new ApiResponse(200, reposWithDrafts, "Draft statuses checked successfully."));
});


export { getReadme, saveReadme, deleteReadme, checkDraftsStatus }; // Export the new function
