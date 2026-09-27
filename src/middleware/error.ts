import { ErrorHandler } from "hono";
import { AppError, UsageLimitError } from "../lib/errors";

/**
 * Global error handler — maps domain errors to HTTP responses.
 * UsageLimitError gets a structured body so frontends can show upgrade prompts.
 */
export const errorHandler: ErrorHandler = (err, c) => {
  const requestId = c.get("requestId" as never) as string | undefined;

  if (err instanceof UsageLimitError) {
    return c.json(
      {
        error: {
          code: "USAGE_LIMIT_REACHED",
          message: err.message,
          featureCode: err.featureCode,
          limit: err.limit,
          used: err.used,
        },
        ...(requestId && { requestId }),
      },
      429
    );
  }

  if (err instanceof AppError) {
    return c.json(
      { error: err.message, ...(requestId && { requestId }) },
      err.statusCode as never
    );
  }

  console.error("[UnhandledError]", { requestId, message: err.message, stack: err.stack });

  return c.json(
    { error: "Internal server error", ...(requestId && { requestId }) },
    500
  );
};
