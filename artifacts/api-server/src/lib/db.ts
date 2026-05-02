import { drizzle } from "drizzle-orm/node-postgres";
import { pool } from "@workspace/db";
import * as schema from "@workspace/db/schema";

export const db = drizzle(pool, { schema });
export { schema };
