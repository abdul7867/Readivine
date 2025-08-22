// This function is a higher-order middleware for Express.js that wraps asynchronous route handlers.
// It ensures that any errors thrown in the async handler are caught and passed to Express's error handler via 'next'.
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };
