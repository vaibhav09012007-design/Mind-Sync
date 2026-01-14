/**
 * Tests for errors module
 */

import { describe, it, expect } from "vitest";
import {
  AppError,
  ValidationError,
  AuthError,
  NotFoundError,
  RateLimitError,
  APIError,
  createSuccessResult,
  createErrorResult,
  safeAction,
} from "../errors";

describe("AppError", () => {
  it("creates error with default values", () => {
    const error = new AppError("Test error");
    expect(error.message).toBe("Test error");
    expect(error.code).toBe("INTERNAL_ERROR");
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(true);
  });

  it("creates error with custom values", () => {
    const error = new AppError("Custom error", "CUSTOM", 418, false);
    expect(error.message).toBe("Custom error");
    expect(error.code).toBe("CUSTOM");
    expect(error.statusCode).toBe(418);
    expect(error.isOperational).toBe(false);
  });
});

describe("ValidationError", () => {
  it("creates validation error with field errors", () => {
    const errors = {
      title: ["Title is required"],
      dueDate: ["Invalid date"],
    };
    const error = new ValidationError(errors);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.statusCode).toBe(400);
    expect(error.errors).toEqual(errors);
    expect(error.message).toContain("Title is required");
  });
});

describe("AuthError", () => {
  it("creates auth error with default message", () => {
    const error = new AuthError();
    expect(error.message).toBe("Authentication required");
    expect(error.code).toBe("AUTH_ERROR");
    expect(error.statusCode).toBe(401);
  });

  it("creates auth error with custom message", () => {
    const error = new AuthError("Session expired");
    expect(error.message).toBe("Session expired");
  });
});

describe("NotFoundError", () => {
  it("creates not found error with default resource", () => {
    const error = new NotFoundError();
    expect(error.message).toBe("Resource not found");
    expect(error.statusCode).toBe(404);
  });

  it("creates not found error with custom resource", () => {
    const error = new NotFoundError("Task");
    expect(error.message).toBe("Task not found");
  });
});

describe("RateLimitError", () => {
  it("creates rate limit error with default retry", () => {
    const error = new RateLimitError();
    expect(error.retryAfter).toBe(60);
    expect(error.statusCode).toBe(429);
  });

  it("creates rate limit error with custom retry", () => {
    const error = new RateLimitError(120);
    expect(error.retryAfter).toBe(120);
  });
});

describe("APIError", () => {
  it("creates API error with service name", () => {
    const error = new APIError("Gemini", "Rate limit exceeded");
    expect(error.message).toBe("Gemini API error: Rate limit exceeded");
    expect(error.service).toBe("Gemini");
    expect(error.statusCode).toBe(502);
  });
});

describe("createSuccessResult", () => {
  it("creates success result with data", () => {
    const result = createSuccessResult({ id: "123" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ id: "123" });
    }
  });

  it("creates success result with void", () => {
    const result = createSuccessResult(undefined);
    expect(result.success).toBe(true);
  });
});

describe("createErrorResult", () => {
  it("handles AppError", () => {
    const error = new ValidationError({ title: ["Required"] });
    const result = createErrorResult(error);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("VALIDATION_ERROR");
    }
  });

  it("handles regular Error", () => {
    const error = new Error("Something went wrong");
    const result = createErrorResult(error);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Something went wrong");
    }
  });

  it("handles unknown error", () => {
    const result = createErrorResult("string error");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("An unexpected error occurred");
    }
  });
});

describe("safeAction", () => {
  it("returns success for resolved promise", async () => {
    const result = await safeAction(async () => ({ id: "123" }));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ id: "123" });
    }
  });

  it("returns error for rejected promise", async () => {
    const result = await safeAction(async () => {
      throw new Error("Failed");
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Failed");
    }
  });

  it("handles AppError in rejected promise", async () => {
    const result = await safeAction(async () => {
      throw new NotFoundError("Task");
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("NOT_FOUND");
    }
  });
});
