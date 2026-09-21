CREATE TABLE "challenge_runs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"deck" jsonb NOT NULL,
	"current" integer DEFAULT 0 NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"submitted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leaderboard_scores" (
	"run_id" uuid PRIMARY KEY NOT NULL,
	"nickname" varchar(18) NOT NULL,
	"score" integer NOT NULL,
	"answered" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leaderboard_scores" ADD CONSTRAINT "leaderboard_scores_run_id_challenge_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."challenge_runs"("id") ON DELETE no action ON UPDATE no action;