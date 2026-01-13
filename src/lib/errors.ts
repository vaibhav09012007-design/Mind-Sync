/**
 * Custom error classes for MindSync
 * Provides typed errors for better error handling
 */

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string = "INTERNAL_ERROR",
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>) {
    const message = Object.values(errors).flat().join(", ");
    super(message, "VALIDATION_ERROR", 400);
    this.errors = errors;
  }
}

export class AuthError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, "AUTH_ERROR", 401);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, "NOT_FOUND", 404);
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfter: number;

  constructor(retryAfter: number = 60) {
    super("Rate limit exceeded. Please try again later.", "RATE_LIMIT", 429);
    this.retryAfter = retryAfter;
  }
}

export class APIError extends AppError {
  public readonly service: string;

  constructor(service: string, message: string) {
    super(`${service} API error: ${message}`, "API_ERROR", 502);
    this.service = service;
  }
}

// --- Result Types ---

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

// --- Helper Functions ---

export function createSuccessResult<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function createErrorResult(error: unknown): ActionResult<never> {
  if (error instanceof AppError) {
    return { success: false, error: error.message, code: error.code };
  }
  if (error instanceof Error) {
    return { success: false, error: error.message };
  }
  return { success: false, error: "An unexpected error occurred" };
}

/**
 * Wrap an async function with error handling
 */
export async function safeAction<T>(
  fn: () => Promise<T>
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return createSuccessResult(data);
  } catch (error) {
    console.error("[Action Error]:", error);
    return createErrorResult(error);
  }
}
