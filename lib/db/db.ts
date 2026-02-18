import postgres from 'postgres';

// Для локальной
// import { drizzle } from 'drizzle-orm/node-postgres';
// import { Pool } from 'pg';


// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL!,
// });

// export const db = drizzle(pool);


// Для supabase
import { drizzle } from 'drizzle-orm/postgres-js'


const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString, {
    ssl: 'require', 
    prepare: false 
})
export const db = drizzle(client);