import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { getAvailableTemplates } from '../services/template.Service.js';

/**
 * @description Retrieves and sends the list of available README templates.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
const getAllTemplates = asyncHandler(async (req, res) => {
  // Get the templates from our service
  const templates = getAvailableTemplates();

  // Send a successful response with the list of templates
  res.status(200).json(new ApiResponse(200, templates, "Templates fetched successfully."));
});

export { getAllTemplates };
