import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { skpLog, perilakuBerakhlak, rencanaKinerja, buktiDukung, buktiDukungBerakhlak } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getDriveClient } from "@/lib/googleDrive";


const aspectMap: Record<string, string> = {
  BERORIENTASI_PELAYANAN: "Berorientasi Pelayanan",
  AKUNTABEL: "Akuntabel",
  KOMPETEN: "Kompeten",
  HARMONIS: "Harmonis",
  LOYAL: "Loyal",
  ADAPTIF: "Adaptif",
  KOLABORATIF: "Kolaboratif",
};

type AspekBerakhlak = "BERORIENTASI_PELAYANAN" | "AKUNTABEL" | "KOMPETEN" | "HARMONIS" | "LOYAL" | "ADAPTIF" | "KOLABORATIF";

const reverseAspectMap: Record<string, AspekBerakhlak> = {
  "Berorientasi Pelayanan": "BERORIENTASI_PELAYANAN",
  "Akuntabel": "AKUNTABEL",
  "Kompeten": "KOMPETEN",
  "Harmonis": "HARMONIS",
  "Loyal": "LOYAL",
  "Adaptif": "ADAPTIF",
  "Kolaboratif": "KOLABORATIF",
};

function getDriveFileId(url: string): string | null {
  if (!url.includes("drive.google.com")) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) return match[1];
  const matchId = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  if (matchId && matchId[1]) return matchId[1];
  return null;
}

async function deleteFileByUrl(url: string) {
  if (!url) return;

  const driveFileId = getDriveFileId(url);
  if (driveFileId) {
    try {
      console.log(`Attempting to delete file from Google Drive via OAuth2. ID: ${driveFileId}`);
      const drive = getDriveClient();
      await drive.files.delete({ fileId: driveFileId });
      console.log(`Successfully deleted file from Google Drive. ID: ${driveFileId}`);
    } catch (err) {
      console.error(`Failed to delete file from Google Drive. ID: ${driveFileId}`, err);
    }
  }
}

const formatDate = (d: Date | string) => {
  const dateObj = typeof d === "string" ? new Date(d) : d;
  const year = dateObj.getUTCFullYear();
  const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch Tugas Rutin (skpLog)
    const logs = await db.query.skpLog.findMany({
      where: eq(skpLog.userId, session.user.id),
      with: {
        rencanaKinerja: true,
        buktiDukung: true,
      },
    });

    // Fetch BerAKHLAK (perilakuBerakhlak)
    const perilakus = await db.query.perilakuBerakhlak.findMany({
      where: eq(perilakuBerakhlak.userId, session.user.id),
      with: {
        buktiDukung: true,
      },
    });

    // Map database records to frontend Activity interface
    const mappedLogs = logs.map((item) => ({
      id: item.id,
      title: item.kegiatan,
      category: "Tugas Rutin" as const,
      date: formatDate(item.tanggal),
      timeStart: "",
      timeEnd: "",
      rhk: item.rencanaKinerja?.deskripsi || "",
      outputCount: item.outputCount,
      outputType: item.outputType,
      hasAttachment: (item.buktiDukung || []).length > 0,
      attachmentName: item.buktiDukung?.[0]?.namaFile || undefined,
      attachmentUrl: item.buktiDukung?.[0]?.url || undefined,
      attachments: (item.buktiDukung || []).map((b) => ({
        name: b.namaFile || "",
        url: b.url,
      })),
    }));

    const mappedPerilakus = perilakus.map((item) => ({
      id: item.id,
      title: `[${aspectMap[item.aspek] || item.aspek}] ${item.wujudPerbuatan}`,
      category: "BerAKHLAK" as const,
      date: formatDate(item.tanggal),
      timeStart: "",
      timeEnd: "",
      rhk: "Rencana Hasil Kerja Terkait Kinerja Organisasi",
      outputCount: 1,
      outputType: "Dokumen",
      hasAttachment: (item.buktiDukung || []).length > 0,
      attachmentName: item.buktiDukung?.[0]?.namaFile || undefined,
      attachmentUrl: item.buktiDukung?.[0]?.url || undefined,
      attachments: (item.buktiDukung || []).map((b) => ({
        name: b.namaFile || "",
        url: b.url,
      })),
    }));

    // Combine and sort by date descending
    const allActivities = [...mappedLogs, ...mappedPerilakus].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json(allActivities);
  } catch (error) {
    console.error("GET Activity error:", error);
    return NextResponse.json({ error: "Failed to fetch activities data" }, { status: 500 });
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
    const { title, category, date, rhk, outputCount, outputType, attachmentName, attachmentUrl, attachments, period } = body;

    if (!title || !category || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newId = crypto.randomUUID();

    if (category === "Tugas Rutin") {
      let matchingRhkId = "";
      const queryConditions = [
        eq(rencanaKinerja.userId, session.user.id),
        eq(rencanaKinerja.deskripsi, rhk)
      ];
      if (period) {
        queryConditions.push(eq(rencanaKinerja.tahun, period));
      }
      
      const matchingRhk = await db.query.rencanaKinerja.findFirst({
        where: and(...queryConditions)
      });

      if (!matchingRhk) {
        const firstRhk = await db.query.rencanaKinerja.findFirst({
          where: eq(rencanaKinerja.userId, session.user.id),
        });
        if (!firstRhk) {
          return NextResponse.json({ error: "Silakan buat Rencana Hasil Kerja (RHK) terlebih dahulu." }, { status: 400 });
        }
        matchingRhkId = firstRhk.id;
      } else {
        matchingRhkId = matchingRhk.id;
      }

      await db.insert(skpLog).values({
        id: newId,
        tanggal: new Date(date),
        kegiatan: title,
        userId: session.user.id,
        rencanaKinerjaId: matchingRhkId,
        outputCount: outputCount || 1,
        outputType: outputType || "Dokumen",
      });

      if (attachments && Array.isArray(attachments)) {
        for (const att of attachments) {
          await db.insert(buktiDukung).values({
            id: crypto.randomUUID(),
            url: att.url,
            namaFile: att.name,
            skpLogId: newId,
          });
        }
      } else if (attachmentName) {
        await db.insert(buktiDukung).values({
          id: crypto.randomUUID(),
          url: attachmentUrl || `/uploads/${attachmentName}`,
          namaFile: attachmentName,
          skpLogId: newId,
        });
      }
    } else {
      // category === "BerAKHLAK"
      let wujud = title;
      let aspekKey: AspekBerakhlak = "BERORIENTASI_PELAYANAN";
      const aspectMatch = title.match(/^\[(.*?)\]\s*(.*)$/);
      if (aspectMatch) {
        const aspectName = aspectMatch[1];
        wujud = aspectMatch[2];
        aspekKey = reverseAspectMap[aspectName] || "BERORIENTASI_PELAYANAN";
      }

      await db.insert(perilakuBerakhlak).values({
        id: newId,
        tanggal: new Date(date),
        aspek: aspekKey,
        wujudPerbuatan: wujud,
        userId: session.user.id,
      });

      if (attachments && Array.isArray(attachments)) {
        for (const att of attachments) {
          await db.insert(buktiDukungBerakhlak).values({
            id: crypto.randomUUID(),
            url: att.url,
            namaFile: att.name,
            perilakuBerakhlakId: newId,
          });
        }
      } else if (attachmentName) {
        await db.insert(buktiDukungBerakhlak).values({
          id: crypto.randomUUID(),
          url: attachmentUrl || `/uploads/${attachmentName}`,
          namaFile: attachmentName,
          perilakuBerakhlakId: newId,
        });
      }
    }

    const resAttachments = attachments && Array.isArray(attachments)
      ? attachments
      : (attachmentName ? [{ name: attachmentName, url: attachmentUrl || "" }] : []);

    return NextResponse.json({
      id: newId,
      title,
      category,
      date,
      timeStart: "",
      timeEnd: "",
      rhk: category === "Tugas Rutin" ? rhk : "Rencana Hasil Kerja Terkait Kinerja Organisasi",
      outputCount: category === "Tugas Rutin" ? (outputCount || 1) : 1,
      outputType: category === "Tugas Rutin" ? (outputType || "Dokumen") : "Dokumen",
      hasAttachment: resAttachments.length > 0,
      attachmentName: resAttachments[0]?.name || undefined,
      attachmentUrl: resAttachments[0]?.url || undefined,
      attachments: resAttachments,
    });
  } catch (error) {
    console.error("POST Activity error:", error);
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 });
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
    const { id, title, category, date, rhk, outputCount, outputType, attachmentName, attachmentUrl, attachments, period } = body;

    if (!id || !title || !category || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (category === "Tugas Rutin") {
      const existingLog = await db.query.skpLog.findFirst({
        where: (sl, { and, eq }) => and(eq(sl.id, id), eq(sl.userId, session.user.id)),
      });
      if (!existingLog) {
        return NextResponse.json({ error: "Log not found or forbidden" }, { status: 404 });
      }

      let matchingRhkId = existingLog.rencanaKinerjaId;
      const queryConditions = [
        eq(rencanaKinerja.userId, session.user.id),
        eq(rencanaKinerja.deskripsi, rhk)
      ];
      if (period) {
        queryConditions.push(eq(rencanaKinerja.tahun, period));
      }
      
      const matchingRhk = await db.query.rencanaKinerja.findFirst({
        where: and(...queryConditions)
      });
      if (matchingRhk) {
        matchingRhkId = matchingRhk.id;
      }

      await db.update(skpLog)
        .set({
          tanggal: new Date(date),
          kegiatan: title,
          rencanaKinerjaId: matchingRhkId,
          outputCount: outputCount || 1,
          outputType: outputType || "Dokumen",
          updatedAt: new Date(),
        })
        .where(eq(skpLog.id, id));

      const oldBuktis = await db.query.buktiDukung.findMany({
        where: eq(buktiDukung.skpLogId, id),
      });

      const newUrls = (attachments || []).map((a: any) => a.url);
      for (const old of oldBuktis) {
        if (!newUrls.includes(old.url)) {
          await deleteFileByUrl(old.url);
        }
      }

      await db.delete(buktiDukung).where(eq(buktiDukung.skpLogId, id));

      if (attachments && Array.isArray(attachments)) {
        for (const att of attachments) {
          await db.insert(buktiDukung).values({
            id: crypto.randomUUID(),
            url: att.url,
            namaFile: att.name,
            skpLogId: id,
          });
        }
      } else if (attachmentName) {
        await db.insert(buktiDukung).values({
          id: crypto.randomUUID(),
          url: attachmentUrl || `/uploads/${attachmentName}`,
          namaFile: attachmentName,
          skpLogId: id,
        });
      }
    } else {
      // category === "BerAKHLAK"
      const existingPerilaku = await db.query.perilakuBerakhlak.findFirst({
        where: (pb, { and, eq }) => and(eq(pb.id, id), eq(pb.userId, session.user.id)),
      });
      if (!existingPerilaku) {
        return NextResponse.json({ error: "Perilaku not found or forbidden" }, { status: 404 });
      }

      let wujud = title;
      let aspekKey: AspekBerakhlak = "BERORIENTASI_PELAYANAN";
      const aspectMatch = title.match(/^\[(.*?)\]\s*(.*)$/);
      if (aspectMatch) {
        const aspectName = aspectMatch[1];
        wujud = aspectMatch[2];
        aspekKey = reverseAspectMap[aspectName] || "BERORIENTASI_PELAYANAN";
      }

      await db.update(perilakuBerakhlak)
        .set({
          tanggal: new Date(date),
          aspek: aspekKey,
          wujudPerbuatan: wujud,
          updatedAt: new Date(),
        })
        .where(eq(perilakuBerakhlak.id, id));

      const oldBuktis = await db.query.buktiDukungBerakhlak.findMany({
        where: eq(buktiDukungBerakhlak.perilakuBerakhlakId, id),
      });

      const newUrls = (attachments || []).map((a: any) => a.url);
      for (const old of oldBuktis) {
        if (!newUrls.includes(old.url)) {
          await deleteFileByUrl(old.url);
        }
      }

      await db.delete(buktiDukungBerakhlak).where(eq(buktiDukungBerakhlak.perilakuBerakhlakId, id));

      if (attachments && Array.isArray(attachments)) {
        for (const att of attachments) {
          await db.insert(buktiDukungBerakhlak).values({
            id: crypto.randomUUID(),
            url: att.url,
            namaFile: att.name,
            perilakuBerakhlakId: id,
          });
        }
      } else if (attachmentName) {
        await db.insert(buktiDukungBerakhlak).values({
          id: crypto.randomUUID(),
          url: attachmentUrl || `/uploads/${attachmentName}`,
          namaFile: attachmentName,
          perilakuBerakhlakId: id,
        });
      }
    }

    const resAttachments = attachments && Array.isArray(attachments)
      ? attachments
      : (attachmentName ? [{ name: attachmentName, url: attachmentUrl || "" }] : []);

    return NextResponse.json({
      id,
      title,
      category,
      date,
      timeStart: "",
      timeEnd: "",
      rhk: category === "Tugas Rutin" ? rhk : "Rencana Hasil Kerja Terkait Kinerja Organisasi",
      outputCount: category === "Tugas Rutin" ? (outputCount || 1) : 1,
      outputType: category === "Tugas Rutin" ? (outputType || "Dokumen") : "Dokumen",
      hasAttachment: resAttachments.length > 0,
      attachmentName: resAttachments[0]?.name || undefined,
      attachmentUrl: resAttachments[0]?.url || undefined,
      attachments: resAttachments,
    });
  } catch (error) {
    console.error("PUT Activity error:", error);
    return NextResponse.json({ error: "Failed to update activity" }, { status: 500 });
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
      return NextResponse.json({ error: "Missing activity ID" }, { status: 400 });
    }

    // Check in skpLog
    const existingLog = await db.query.skpLog.findFirst({
      where: (sl, { and, eq }) => and(eq(sl.id, id), eq(sl.userId, session.user.id)),
      with: { buktiDukung: true },
    });
    if (existingLog) {
      for (const bukti of existingLog.buktiDukung || []) {
        await deleteFileByUrl(bukti.url);
      }
      await db.delete(buktiDukung).where(eq(buktiDukung.skpLogId, id));
      await db.delete(skpLog).where(eq(skpLog.id, id));
      return NextResponse.json({ success: true });
    }

    // Check in perilakuBerakhlak
    const existingPerilaku = await db.query.perilakuBerakhlak.findFirst({
      where: (pb, { and, eq }) => and(eq(pb.id, id), eq(pb.userId, session.user.id)),
      with: { buktiDukung: true },
    });
    if (existingPerilaku) {
      for (const bukti of existingPerilaku.buktiDukung || []) {
        await deleteFileByUrl(bukti.url);
      }
      await db.delete(buktiDukungBerakhlak).where(eq(buktiDukungBerakhlak.perilakuBerakhlakId, id));
      await db.delete(perilakuBerakhlak).where(eq(perilakuBerakhlak.id, id));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Activity not found" }, { status: 404 });
  } catch (error) {
    console.error("DELETE Activity error:", error);
    return NextResponse.json({ error: "Failed to delete activity" }, { status: 500 });
  }
}
