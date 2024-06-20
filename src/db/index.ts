import { drizzle } from 'drizzle-orm/postgres-js';
import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env' });

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client);
