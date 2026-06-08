import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { identifier } = await request.json();
    if (!identifier) {
      return NextResponse.json({ error: "Missing identifier" }, { status: 400 });
    }

    // Find user by email, username, or NIP
    const user = await db.query.users.findFirst({
      where: or(
        eq(users.email, identifier),
        eq(users.username, identifier),
        eq(users.nip, identifier)
      ),
    });

    if (!user) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    // Return the email and username
    return NextResponse.json({
      email: user.email,
      username: user.username,
    });
  } catch (error) {
    console.error("Resolve identifier error:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}
