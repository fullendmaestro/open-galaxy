ALTER TABLE "User" ADD COLUMN "isOnboarded" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "avatar" varchar(256);