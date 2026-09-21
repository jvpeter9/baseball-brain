import pg from 'pg';
import {drizzle} from 'drizzle-orm/node-postgres';
import {attachDatabasePool} from '@vercel/functions';
let database;
export function getDb(){
 if(!process.env.DATABASE_URL)throw new Error('Database not configured');
 if(!database){const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:3,connectionTimeoutMillis:10000,idleTimeoutMillis:5000});if(process.env.VERCEL)attachDatabasePool(pool);database=drizzle(pool);}
 return database;
}
