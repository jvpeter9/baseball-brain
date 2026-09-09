import {pgTable,uuid,timestamp,jsonb,integer,varchar,boolean} from 'drizzle-orm/pg-core';
export const runs=pgTable('challenge_runs',{
 id:uuid('id').primaryKey(),startedAt:timestamp('started_at',{withTimezone:true}).notNull().defaultNow(),
 expiresAt:timestamp('expires_at',{withTimezone:true}).notNull(),deck:jsonb('deck').notNull(),
 current:integer('current').notNull().default(0),score:integer('score').notNull().default(0),
 submitted:boolean('submitted').notNull().default(false),lastAnswer:jsonb('last_answer'),timing:jsonb('timing'),
});
export const scores=pgTable('leaderboard_scores',{
 runId:uuid('run_id').primaryKey().references(()=>runs.id),nickname:varchar('nickname',{length:18}).notNull(),
 score:integer('score').notNull(),answered:integer('answered').notNull(),createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow(),
});
