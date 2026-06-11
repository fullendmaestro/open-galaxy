import { getSession, createSession } from "@/lib/auth/session";
import { completeUserOnboarding } from "@/lib/db/queries";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { avatar, username, fullName, role, email } = await request.json();

    if (!username || !fullName || !role || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // 1. Update the database
    await completeUserOnboarding(session.user.id, {
      avatar,
      username,
      fullName,
      role,
      email,
    });

    // 2. Refresh the JWT session
    await createSession(
      session.user.id,
      session.user.publicKey,
      session.user.privateKey,
      session.user.accountId,
      true,
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Onboarding error:", error);
    const message =
      error.message === "Username is already taken"
        ? error.message
        : "Failed to complete onboarding";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
