import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { rencanaKinerja, skpLog } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all rencanaKinerja for the user
    const rhks = await db
      .select()
      .from(rencanaKinerja)
      .where(eq(rencanaKinerja.userId, session.user.id));

    // Fetch all skpLogs for the user to count progress in-memory
    const logs = await db
      .select()
      .from(skpLog)
      .where(eq(skpLog.userId, session.user.id));

    // Map database records to RhkItem interface expected by AppContext
    const mappedRhks = rhks.map((item) => {
      const itemLogs = logs.filter((l) => l.rencanaKinerjaId === item.id);
      return {
        id: item.id,
        type: item.kategori === "TAMBAHAN" ? "Tambahan" : "Utama",
        title: item.deskripsi,
        indicator: item.indicator || "Laporan hasil kegiatan capaian kinerja.",
        currentProgress: itemLogs.length,
        targetProgress: item.bulanPelaksanaan?.length || 10,
        period: item.tahun || "2024",
        months: item.bulanPelaksanaan,
      };
    });

    return NextResponse.json(mappedRhks);
  } catch (error) {
    console.error("GET RHK error:", error);
    return NextResponse.json({ error: "Failed to fetch RHK data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, type, period, months, indicator } = body;

    if (!title || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newRhkId = crypto.randomUUID();
    const newRhk = {
      id: newRhkId,
      deskripsi: title,
      kategori: (type.toUpperCase() === "TAMBAHAN" ? "TAMBAHAN" : "UTAMA") as "TAMBAHAN" | "UTAMA",
      userId: session.user.id,
      bulanPelaksanaan: months || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      tahun: period || "2026",
      indicator: indicator || "Laporan hasil kegiatan capaian kinerja.",
    };

    await db.insert(rencanaKinerja).values(newRhk);

    // Return mapped RhkItem
    return NextResponse.json({
      id: newRhk.id,
      type: newRhk.kategori === "TAMBAHAN" ? "Tambahan" : "Utama",
      title: newRhk.deskripsi,
      indicator: newRhk.indicator,
      currentProgress: 0,
      targetProgress: newRhk.bulanPelaksanaan.length,
      period: newRhk.tahun,
      months: newRhk.bulanPelaksanaan,
    });
  } catch (error) {
    console.error("POST RHK error:", error);
    return NextResponse.json({ error: "Failed to create RHK" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing RHK ID" }, { status: 400 });
    }

    // Ensure this RHK belongs to the user
    const existing = await db.query.rencanaKinerja.findFirst({
      where: eq(rencanaKinerja.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: "RHK not found" }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.delete(rencanaKinerja).where(eq(rencanaKinerja.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE RHK error:", error);
    return NextResponse.json({ error: "Failed to delete RHK" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, type, period, months, indicator } = body;

    if (!id || !title || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Ensure the RHK belongs to the user
    const existing = await db.query.rencanaKinerja.findFirst({
      where: eq(rencanaKinerja.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: "RHK not found" }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.update(rencanaKinerja)
      .set({
        deskripsi: title,
        kategori: (type.toUpperCase() === "TAMBAHAN" ? "TAMBAHAN" : "UTAMA") as "TAMBAHAN" | "UTAMA",
        bulanPelaksanaan: months || existing.bulanPelaksanaan,
        tahun: period || existing.tahun,
        indicator: indicator || existing.indicator,
        updatedAt: new Date(),
      })
      .where(eq(rencanaKinerja.id, id));

    return NextResponse.json({
      id,
      type: type.toUpperCase() === "TAMBAHAN" ? "Tambahan" : "Utama",
      title,
      indicator: indicator || existing.indicator,
      currentProgress: 0, // Frontend keeps currentProgress on map
      targetProgress: months ? months.length : existing.bulanPelaksanaan.length,
      period: period || existing.tahun,
      months: months || existing.bulanPelaksanaan,
    });
  } catch (error) {
    console.error("PUT RHK error:", error);
    return NextResponse.json({ error: "Failed to update RHK" }, { status: 500 });
  }
}
