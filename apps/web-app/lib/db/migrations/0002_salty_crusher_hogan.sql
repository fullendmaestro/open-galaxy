ALTER TABLE "User" ADD COLUMN "username" varchar(64);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "fullName" varchar(128);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "role" varchar(32);--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_username_unique" UNIQUE("username");