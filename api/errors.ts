/**
 * API Error Classes
 *
 * Extracted into a standalone module so lightweight consumers (e.g. queryClient)
 * can reference ApiClientError without pulling in the full API client and its
 * expo-constants / fetch dependencies.
 */

import type { ApiError } from "./types";

/**
 * Custom error class for API errors
 */
export class ApiClientError extends Error {
  statusCode: number;
  originalError?: ApiError;

  constructor(message: string, statusCode: number, originalError?: ApiError) {
    super(message);
    this.name = "ApiClientError";
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}
