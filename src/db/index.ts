import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";
import { config } from "dotenv";

config({ path: ".env.local" });


const connectionString = process.env.DATABASE_URL || "mysql://root:@localhost:3306/db_skp_log";

// Create a connection pool to MySQL
export const connection = mysql.createPool(connectionString);
export const db = drizzle(connection, { schema, mode: "default" });
