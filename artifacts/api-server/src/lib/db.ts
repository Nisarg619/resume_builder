import { drizzle } from "drizzle-orm/node-postgres";
import { pg } from "@workspace/db";
import * as schema from "@workspace/db/schema";

export const db = drizzle(pg, { schema });
export { schema };
