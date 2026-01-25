/**
 * Environment Variable Validation
 * Provides type-safe access to environment variables with validation
 * Fails fast at startup if required variables are missing
 */

import { z } from "zod";

/**
 * Schema for all environment variables
 * Add new required variables here
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Clerk Auth
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, "Clerk publishable key is required"),
  CLERK_SECRET_KEY: z.string().min(1, "Clerk secret key is required"),

  // Google AI (optional for development, required for AI features)
  GEMINI_API_KEY: z.string().optional(),

  // Environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
}).partial().refine((data) => data.DATABASE_URL, {
  message: "DATABASE_URL is required",
}).refine((data) => data.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, {
  message: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required",
}).refine((data) => data.CLERK_SECRET_KEY, {
  message: "CLERK_SECRET_KEY is required",
});

type EnvSchema = z.infer<typeof envSchema>;

// Cached validated environment
let validatedEnv: EnvSchema | null = null;

/**
 * Validate all environment variables at once
 * Call this at app startup to fail fast if config is invalid
 */
export function validateEnv(): EnvSchema {
  if (validatedEnv) return validatedEnv;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([field, msgs]) => `  ${field}: ${msgs?.join(", ")}`)
      .join("\n");

    console.error("❌ Invalid environment variables:\n" + errorMessages);

    // In production, throw to prevent startup with invalid config
    if (process.env.NODE_ENV === "production") {
      throw new Error("Invalid environment configuration. Check server logs.");
    }
  }

  // Use defaults for missing optional values
  validatedEnv = result.success
    ? result.data
    : { ...process.env, NODE_ENV: "development" } as EnvSchema;

  return validatedEnv;
}

/**
 * Get a specific environment variable with validation
 * Throws if the variable is missing or invalid
 *
 * @param key - The environment variable key
 * @returns The validated value
 * @throws Error if the variable is missing
 */
export function getEnv<K extends keyof EnvSchema>(key: K): EnvSchema[K] {
  const env = validateEnv();
  const value = env[key];

  if (value === undefined || value === "") {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        `Please add it to your .env file or deployment configuration.`
    );
  }

  return value;
}

/**
 * Get an optional environment variable
 * Returns undefined if not set, doesn't throw
 *
 * @param key - The environment variable key
 * @returns The value or undefined
 */
export function getEnvOptional<K extends keyof EnvSchema>(
  key: K
): EnvSchema[K] | undefined {
  try {
    const env = validateEnv();
    return env[key];
  } catch {
    return undefined;
  }
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getEnvOptional("NODE_ENV") === "production";
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getEnvOptional("NODE_ENV") === "development";
}
