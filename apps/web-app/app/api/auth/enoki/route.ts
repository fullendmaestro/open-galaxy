import { createClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";
import * as ed from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha512";

if (!ed.etc.sha512Sync) {
  ed.etc.sha512Sync = (...m: Uint8Array[]) => {
    const h = sha512.create();
    for (const msg of m) h.update(msg);
    return h.digest();
  };
}

// 1. Initialize Supabase Admin (Bypasses RLS to manage users)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// 2. Prepare the Supabase JWT Secret
const SUPABASE_JWT_SECRET = new TextEncoder().encode(
  process.env.SUPABASE_JWT_SECRET!,
);

const HEX_64_REGEX = /^[0-9a-f]{64}$/i;
const SUI_ADDRESS_REGEX = /^0x[0-9a-f]{64}$/i;

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Helper to create a Supabase-compatible JWT
 */
async function createSupabaseToken(user: any) {
  return await new SignJWT({
    aud: "authenticated",
    role: "authenticated",
    sub: user.id, // Supabase maps this to auth.uid()
    email: `${user.sui_address}@enoki.local`, // Dummy email for compatibility
    user_metadata: {
      suiAddress: user.sui_address,
      publicKey: user.public_key,
      accountId: user.account_id,
      privateKey: user.delegate_private_key,
    },
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(SUPABASE_JWT_SECRET);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { suiAddress, privateKey, accountId } = body;

    if (!suiAddress || !SUI_ADDRESS_REGEX.test(suiAddress)) {
      return Response.json({ error: "Invalid Sui address." }, { status: 400 });
    }

    // Phase 1: Check — only suiAddress provided
    if (!privateKey && !accountId) {
      const { data: existing } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("sui_address", suiAddress)
        .single();

      if (
        existing?.delegate_private_key &&
        existing?.public_key &&
        existing?.account_id
      ) {
        // Returning user: Generate a Supabase session token
        const token = await createSupabaseToken(existing);
        return Response.json({ success: true, needsSetup: false, token });
      }

      return Response.json({ success: true, needsSetup: true });
    }

    // Phase 2: Register — full credentials provided
    if (
      !privateKey ||
      typeof privateKey !== "string" ||
      !HEX_64_REGEX.test(privateKey)
    ) {
      return Response.json({ error: "Invalid private key." }, { status: 400 });
    }

    if (
      !accountId ||
      typeof accountId !== "string" ||
      !SUI_ADDRESS_REGEX.test(accountId)
    ) {
      return Response.json(
        { error: "Valid account ID is required." },
        { status: 400 },
      );
    }

    const privKeyBytes = hexToBytes(privateKey);
    const derivedPubKeyBytes = ed.getPublicKey(privKeyBytes);
    const derivedPublicKey = bytesToHex(derivedPubKeyBytes);

    // Upsert the user into the Supabase database
    const { data: user, error: upsertError } = await supabaseAdmin
      .from("users")
      .upsert(
        {
          sui_address: suiAddress,
          public_key: derivedPublicKey,
          delegate_private_key: privateKey,
          account_id: accountId,
        },
        { onConflict: "sui_address" }, // Requires unique constraint on sui_address
      )
      .select()
      .single();

    if (upsertError || !user) {
      throw new Error(upsertError?.message || "Failed to upsert user");
    }

    // Generate the Supabase session token for the newly registered user
    const token = await createSupabaseToken(user);

    return Response.json({ success: true, needsSetup: false, token });
  } catch (error) {
    console.error("[auth:enoki] Error:", error);
    return Response.json({ error: "Authentication failed" }, { status: 500 });
  }
}
