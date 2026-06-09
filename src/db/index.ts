import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";
import { config } from "dotenv";

config({ path: ".env.local" });


const connectionString = process.env.DATABASE_URL || "mysql://root:@localhost:3306/db_skp_log";

// Create a connection pool to MySQL
const globalForDb = globalThis as unknown as {
  connection: mysql.Pool | undefined;
  db: any;
};

export const connection = globalForDb.connection ?? mysql.createPool(connectionString);

const localDb = drizzle(connection, { schema, mode: "default" });
export const db = (globalForDb.db ?? localDb) as typeof localDb;

if (process.env.NODE_ENV !== "production") {
  globalForDb.connection = connection;
  globalForDb.db = db;
}

