/**
 * API Client - Base HTTP client with Clerk authentication
 */

import Constants from "expo-constants";

import { ApiClientError } from "./errors";
import { logger } from "@/lib/logger";
import type { ApiError } from "./types";

export { ApiClientError };

const API_URL = Constants.expoConfig?.extra?.apiUrl ?? "http://localhost:3000";

// API configuration
const API_CONFIG = {
  // Default to localhost for development
  // This should be configured via environment variables in production
  baseUrl: API_URL,
  timeout: 30000,
};

/**
 * Type for the getToken function from Clerk's useAuth hook
 */
export type GetTokenFn = () => Promise<string | null>;

/**
 * Request options for the API client
 */
interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string | undefined>;
}

/**
 * Build URL with query parameters
 */
function buildUrl(
  path: string,
  params?: Record<string, string | undefined>,
): string {
  const url = new URL(path, API_CONFIG.baseUrl);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, value);
      }
    });
  }

  return url.toString();
}

/**
 * Make an authenticated API request
 */
async function request<T>(
  path: string,
  getToken: GetTokenFn,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, headers = {}, params } = options;

  // Get the JWT token from Clerk
  const token = await getToken();

  if (!token) {
    logger.warn("Clerk getToken() returned null — session token may have expired", {
      path,
      method,
    });
    throw new ApiClientError("Not authenticated", 401);
  }

  const url = buildUrl(path, params);

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...headers,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle error responses
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const apiError = data as ApiError;
      throw new ApiClientError(
        apiError.message || `Request failed with status ${response.status}`,
        response.status,
        apiError,
      );
    }

    // Handle empty responses (204 No Content, etc.)
    if (response.status === 204 || response.headers.get("content-length") === "0") {
      return undefined as T;
    }

    return await response.json() as T;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiClientError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new ApiClientError("Request timeout", 408);
      }
      throw new ApiClientError(error.message, 0);
    }

    throw new ApiClientError("Unknown error occurred", 0);
  }
}

/**
 * API client factory - creates client methods bound to a getToken function
 */
export function createApiClient(getToken: GetTokenFn) {
  return {
    get: <T>(path: string, params?: Record<string, string | undefined>) =>
      request<T>(path, getToken, { method: "GET", params }),

    post: <T>(path: string, body: unknown) =>
      request<T>(path, getToken, { method: "POST", body }),

    patch: <T>(path: string, body: unknown) =>
      request<T>(path, getToken, { method: "PATCH", body }),

    put: <T>(path: string, body: unknown) =>
      request<T>(path, getToken, { method: "PUT", body }),

    delete: <T>(path: string) =>
      request<T>(path, getToken, { method: "DELETE" }),
  };
}

/**
 * Type for the API client
 */
export type ApiClient = ReturnType<typeof createApiClient>;
