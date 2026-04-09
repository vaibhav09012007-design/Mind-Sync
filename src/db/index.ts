import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

const isProduction = process.env.NODE_ENV === "production";

const client = postgres(connectionString, {
  prepare: false,
  // Connection pool settings
  max: isProduction ? 10 : 3, // Max connections in pool
  idle_timeout: 20, // Close idle connections after 20s
  connect_timeout: 10, // Timeout new connections after 10s
  max_lifetime: 60 * 30, // Recycle connections every 30 minutes
});

export const db = drizzle(client, { schema });
