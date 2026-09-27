import { ErrorHandler } from "hono";
import { AppError } from "../lib/errors";

/**
 * Global error handler — catches AppError subclasses from services
 * and maps them to HTTP responses. Unknown errors become 500.
 *
 * Keeps controllers clean: no try/catch needed, just throw domain errors.
 */
export const errorHandler: ErrorHandler = (err, c) => {
  const requestId = c.get("requestId" as never) as string | undefined;

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
