import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
const connectionString = process.env.DATABASE_URL ?? 'postgresql://vibefit:vibefit@localhost:5432/vibefit';
const client = postgres(connectionString);
export const db = drizzle(client, { schema });
export { schema };
//# sourceMappingURL=index.js.map