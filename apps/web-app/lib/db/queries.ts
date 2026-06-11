import "server-only";

import { eq, type SQL } from "drizzle-orm";
import { ChatbotError } from "../errors";
import { type User, user } from "./schema";
import { db } from "./drizzle";

// ============================================================
// User queries
// ============================================================

/** Look up a user by their UUID primary key. */
export async function getUserById(id: string): Promise<User | null> {
  try {
    const [found] = await db.select().from(user).where(eq(user.id, id));
    return found ?? null;
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to get user by id");
  }
}

export async function getUserByPublicKey(
  publicKey: string,
): Promise<User | null> {
  try {
    const [found] = await db
      .select()
      .from(user)
      .where(eq(user.publicKey, publicKey));
    return found ?? null;
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get user by public key",
    );
  }
}

export async function createUserByPublicKey(publicKey: string): Promise<User> {
  const email = `key-${publicKey.slice(0, 8)}@ed25519`;
  try {
    const [created] = await db
      .insert(user)
      .values({ email, publicKey })
      .returning();
    return created;
  } catch (_error) {
    throw new ChatbotError("bad_request:database", "Failed to create user");
  }
}

/** Look up an Enoki user by their stable zkLogin Sui address. */
export async function getUserBySuiAddress(
  suiAddress: string,
): Promise<User | null> {
  try {
    const [found] = await db
      .select()
      .from(user)
      .where(eq(user.suiAddress, suiAddress));
    return found ?? null;
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to get user by Sui address",
    );
  }
}

/** Create a new user from Enoki zkLogin with stored delegate key credentials for returning login. */
export async function createEnokiUser({
  publicKey,
  suiAddress,
  delegatePrivateKey,
  accountId,
}: {
  publicKey: string;
  suiAddress: string;
  delegatePrivateKey: string;
  accountId: string;
}): Promise<User> {
  const email = `enoki-${suiAddress.slice(0, 8)}@zklogin`;
  try {
    const [created] = await db
      .insert(user)
      .values({ email, publicKey, suiAddress, delegatePrivateKey, accountId })
      .returning();
    return created;
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to create Enoki user",
    );
  }
}

/** Update an existing Enoki user's delegate key credentials (e.g. after key rotation). */
export async function updateEnokiUserCredentials({
  userId,
  publicKey,
  delegatePrivateKey,
  accountId,
}: {
  userId: string;
  publicKey: string;
  delegatePrivateKey: string;
  accountId: string;
}): Promise<void> {
  try {
    await db
      .update(user)
      .set({ publicKey, delegatePrivateKey, accountId })
      .where(eq(user.id, userId));
  } catch (_error) {
    throw new ChatbotError(
      "bad_request:database",
      "Failed to update Enoki user credentials",
    );
  }
}

export async function completeUserOnboarding(
  userId: string,
  data: {
    avatar?: string;
    username: string;
    fullName: string;
    role: string;
    email: string;
  },
): Promise<void> {
  try {
    await db
      .update(user)
      .set({
        avatar: data.avatar,
        username: data.username,
        fullName: data.fullName,
        email: data.email,
        role: data.role,
        isOnboarded: true,
      })
      .where(eq(user.id, userId));
  } catch (error: any) {
    if (error.code === "23505" && error.message.includes("username")) {
      throw new Error("Username is already taken");
    }
    throw new ChatbotError(
      "bad_request:database",
      "Failed to complete user onboarding",
    );
  }
}
