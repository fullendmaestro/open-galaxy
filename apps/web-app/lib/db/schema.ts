import type { InferSelectModel } from "drizzle-orm";
import {
  customType,
  pgTable,
  uuid,
  varchar,
  boolean,
} from "drizzle-orm/pg-core";

export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
  publicKey: varchar("publicKey", { length: 128 }).unique(),
  suiAddress: varchar("suiAddress", { length: 128 }).unique(),
  delegatePrivateKey: varchar("delegatePrivateKey", { length: 128 }),
  accountId: varchar("accountId", { length: 128 }),
  isOnboarded: boolean("isOnboarded").default(false).notNull(),
  avatar: varchar("avatar", { length: 256 }),
  username: varchar("username", { length: 64 }).unique(),
  fullName: varchar("fullName", { length: 128 }),
  role: varchar("role", { length: 32 }),
});

export type User = InferSelectModel<typeof user>;
