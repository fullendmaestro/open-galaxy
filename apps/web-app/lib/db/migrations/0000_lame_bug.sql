CREATE TABLE "User" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(64) NOT NULL,
	"password" varchar(64),
	"publicKey" varchar(128),
	"suiAddress" varchar(128),
	"delegatePrivateKey" varchar(128),
	"accountId" varchar(128),
	CONSTRAINT "User_publicKey_unique" UNIQUE("publicKey"),
	CONSTRAINT "User_suiAddress_unique" UNIQUE("suiAddress")
);
