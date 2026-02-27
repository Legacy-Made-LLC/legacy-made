/**
 * Centralized Logger
 *
 * Thin wrapper around Sentry.logger.* that also outputs to the dev console.
 * - debug/info/warn: Sentry structured logs only (no Issue created)
 * - error/fatal: Sentry structured log + Sentry.captureException() (creates an Issue)
 *
 * In __DEV__ mode, all levels also print to the JS console for local debugging.
 */

import * as Sentry from "@sentry/react-native";

type LogAttributes = Record<string, unknown>;

function errorToAttributes(
  error: unknown,
): Record<string, string | undefined> {
  if (error instanceof Error) {
    return {
      "error.type": error.name,
      "error.message": error.message,
    };
  }
  if (error !== undefined && error !== null) {
    return { "error.message": String(error) };
  }
  return {};
}

export const logger = {
  debug(message: string, data?: LogAttributes): void {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.debug(`[debug] ${message}`, data ?? "");
    }
    Sentry.logger.debug(message, data);
  },

  info(message: string, data?: LogAttributes): void {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.info(`[info] ${message}`, data ?? "");
    }
    Sentry.logger.info(message, data);
  },

  warn(message: string, data?: LogAttributes): void {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(`[warn] ${message}`, data ?? "");
    }
    Sentry.logger.warn(message, data);
  },

  error(message: string, error?: unknown, data?: LogAttributes): void {
    const attrs = { ...errorToAttributes(error), ...data };

    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error(`[error] ${message}`, error ?? "", data ?? "");
    }
    Sentry.logger.error(message, attrs);

    if (error instanceof Error) {
      Sentry.captureException(error);
    } else if (error !== undefined && error !== null) {
      Sentry.captureException(new Error(String(error)));
    }
  },

  fatal(message: string, error?: unknown, data?: LogAttributes): void {
    const attrs = { ...errorToAttributes(error), ...data };

    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error(`[fatal] ${message}`, error ?? "", data ?? "");
    }
    Sentry.logger.fatal(message, attrs);

    if (error instanceof Error) {
      Sentry.captureException(error, { level: "fatal" });
    } else if (error !== undefined && error !== null) {
      Sentry.captureException(new Error(String(error)), { level: "fatal" });
    }
  },
};
