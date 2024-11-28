// validationHelper.js

/**
 * Validates the input data against a specified schema.
 *
 * @param {Object} data - The input data to be validated.
 * @param {Object} schema - The Joi schema to validate against.
 * @param {Object} res - The response object used to send HTTP responses.
 * @returns {boolean} - Returns true if the input is valid, otherwise sends a response with validation errors and returns false.
 */
const validateInput = (data, schema, res) => {
  // Validate the data using the provided schema
  const { error } = schema.validate(data, { abortEarly: false }); // Validate all errors, not just the first one
  
  if (error) {
    // Extract detailed error messages
    const errorDetails = error.details.map((detail) => detail.message);

    // Log the validation error details for debugging
    console.warn("Input validation failed:", JSON.stringify(errorDetails, null, 2));

    // Send a 400 Bad Request response with the error details
    res.status(400).send({
      success: false,
      message: "Invalid input",
      errors: errorDetails, // List of validation error messages
    });

    return false; // Indicate validation failure
  }

  return true; // Indicate validation success
};

module.exports = { validateInput };
