import type { InferSelectModel } from "drizzle-orm";
import { customType, pgTable, uuid, varchar } from "drizzle-orm/pg-core";

// ============================================================
// Core tables (from v2-test base)
// ============================================================

export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
  publicKey: varchar("publicKey", { length: 128 }).unique(),
  suiAddress: varchar("suiAddress", { length: 128 }).unique(),
  delegatePrivateKey: varchar("delegatePrivateKey", { length: 128 }),
  accountId: varchar("accountId", { length: 128 }),
});

export type User = InferSelectModel<typeof user>;
