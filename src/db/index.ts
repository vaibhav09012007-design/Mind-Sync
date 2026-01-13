import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

// Disable debug logging in production to protect secrets
if (process.env.NODE_ENV !== "production") {
    try {
        const url = new URL(connectionString);
        console.log(`[DB Config] Connecting to: ${url.protocol}//${url.username}:****@${url.hostname}:${url.port}${url.pathname}`);
    } catch (e) {
        // Ignore parsing errors
    }
}

const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
