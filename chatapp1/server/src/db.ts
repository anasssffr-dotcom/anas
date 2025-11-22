import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

let client: any;
let _db: any;

export const getDb = () => {
  if (_db) return _db;

  if (!process.env.DATABASE_URL) {
    throw new Error("❌ DATABASE_URL is not set in environment variables");
  }

  client = postgres(process.env.DATABASE_URL, {
    ssl: "require",
  });

  _db = drizzle(client);

  return _db;
};
