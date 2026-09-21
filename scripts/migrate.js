import {migrate} from 'drizzle-orm/node-postgres/migrator';
import {getDb} from '../db/client.js';
await migrate(getDb(),{migrationsFolder:'./db/migrations'});
console.log('Database migrations applied.');
