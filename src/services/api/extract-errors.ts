import type { ErrorItem, ErrorResponse } from "@/types/api";

/**
 * Converts an array of error items with property and messages
 * into an object with property names as keys and joined messages as values.
 *
 * @param errorArray - Array of error items with property and messages
 * @returns An object with property names as keys and joined messages as values
 * @example
 * // Returns { email: "Invalid email, Email required" }
 * errorArrayToObject([{ property: "email", messages: ["Invalid email", "Email required"] }]);
 */
export function errorArrayToObject(
  errorArray: ErrorItem[],
): Record<string, string> {
  const errorObject: Record<string, string> = {};

  errorArray.forEach((item) => {
    if (item?.property && Array.isArray(item.messages)) {
      errorObject[item.property] = item.messages.join(", ");
    }
  });

  return errorObject;
}

/**
 * Extracts and standardizes error messages from various error formats.
 * Handles string errors, array errors, and converts them to a consistent format.
 *
 * @param err - The error to process, which can be of any type
 * @returns A standardized error response object with a main message and detailed errors
 * @example
 * // Returns { message: "Invalid email", errors: { email: "Invalid email" } }
 * getErrorMessage([{ property: "email", messages: ["Invalid email"] }]);
 *
 * // Returns { message: "Network error", errors: {} }
 * getErrorMessage("Network error");
 */
export function getErrorMessage(err: unknown): ErrorResponse {
  const unknownError = "Something went wrong, please try again later.";
  let message = unknownError;
  let errors: Record<string, string> = {};

  // Handle string error
  if (typeof err === "string") {
    message = err;
    return { message, errors };
  }

  // Handle array error format
  if (Array.isArray(err)) {
    if (err.length > 0) {
      if (typeof err[0] === "string") {
        // console.log('array error...', err);
        // If the first item is a string, treat it as the main error message
        message = err[0] || unknownError;
        errors = errorArrayToObject(
          err.slice(1).map((msg) => ({ property: "error", messages: [msg] })),
        );
      } else if (typeof err[0] === "object") {
        message = err[0]?.messages?.[0] || unknownError;
        errors = errorArrayToObject(err);
      }
    }
    return { message, errors };
  }

  if (
    err &&
    typeof err === "object" &&
    "message" in err &&
    Array.isArray(err.message)
  ) {
    // Handle object with message array
    message = err.message[0] || unknownError;
    errors = errorArrayToObject(
      err.message.map((msg) => ({ property: "error", messages: [msg] })),
    );
  }

  return { message, errors };
}
