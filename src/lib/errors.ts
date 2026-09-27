/**
 * Domain error classes — completely runtime-agnostic.
 * Services throw these; the HTTP error middleware maps them to status codes.
 */

export class AppError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(403, message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
    this.name = "ConflictError";
  }
}

/**
 * Thrown when a user has hit their plan's feature usage limit.
 * Returns 429 with structured error body for frontend to handle gracefully.
 */
export class UsageLimitError extends AppError {
  constructor(
    public readonly featureCode: string,
    public readonly limit: number,
    public readonly used: number
  ) {
    super(429, `Monthly limit reached for "${featureCode}"`);
    this.name = "UsageLimitError";
  }
}

/**
 * Thrown when a user's plan does not include a feature at all.
 */
export class PlanFeatureError extends AppError {
  constructor(public readonly featureCode: string) {
    super(403, `Your current plan does not include "${featureCode}"`);
    this.name = "PlanFeatureError";
  }
}
