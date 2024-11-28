// errorHandler.js

/**
 * Handles errors by logging the details and sending a structured response to the client.
 *
 * @param {Object} res - The response object used to send HTTP responses.
 * @param {Error} error - The error object containing details of the error.
 * @param {string} [context=""] - Optional context to describe where the error occurred.
 */
const handleError = (res, error, context = "") => {
  // Construct detailed error information
  const errorDetails = {
    message: error.message, // Error message
    stack: error.stack, // Stack trace for debugging
    context, // Context where the error occurred
  };

  // Log the error details to the server console
  console.error("Error Occurred:", JSON.stringify(errorDetails, null, 2));

  // Send a structured error response to the client
  res.status(500).send({
    success: false,
    message: "An unexpected error occurred. Please try again later.",
    error: error.message, // Optional: Include error message for client
  });
};

module.exports = { handleError };
