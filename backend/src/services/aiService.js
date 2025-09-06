import axios from 'axios';
import { ApiError } from '../utils/ApiError.js';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const REQUEST_TIMEOUT = 30000; // 30 seconds

const generateContent = async (prompt, model = "openai/gpt-oss-20b:free") => {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new ApiError(500, "OpenRouter API key is not configured on the server.");
  }

  try {
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: model,
        messages: [
          {
            role: "system",
            content: "You are an expert README generator. Your response must be only the raw Markdown content for the requested README.md file. Do not include any conversational text, introductions, or the original prompt in your response. Begin the response directly with the Markdown content."
          },
          { role: "user", content: prompt }
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: REQUEST_TIMEOUT, // Set a client-side timeout
      }
    );

    if (!response.data || !response.data.choices || response.data.choices.length === 0) {
      console.error("Invalid response structure from OpenRouter:", response.data);
      throw new ApiError(500, "Received an invalid or empty response from the AI model.");
    }

    const content = response.data.choices[0]?.message?.content;

    if (!content) {
      throw new ApiError(500, "Failed to extract content from the AI model's response.");
    }

    return content.trim();
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error("OpenRouter API request timed out.");
      throw new ApiError(408, "The request to the AI service timed out. Please try again.");
    }
    
    console.error("Error calling OpenRouter API:", error.response?.data || error.message);
    
    const statusCode = error.response?.status || 502;
    const message = error.response?.data?.error?.message || "Failed to communicate with the AI service.";
    
    throw new ApiError(statusCode, message);
  }
};

export { generateContent };