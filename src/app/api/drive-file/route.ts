import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getDriveClient } from "@/lib/googleDrive";
import { Readable } from "stream";

export async function GET(request: Request) {
  try {
    // 1. Authenticate user session
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse file ID or URL
    const { searchParams } = new URL(request.url);
    let fileId = searchParams.get("id");
    const url = searchParams.get("url");

    if (!fileId && url) {
      const matchD = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (matchD && matchD[1]) {
        fileId = matchD[1];
      } else {
        const matchId = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
        if (matchId && matchId[1]) {
          fileId = matchId[1];
        }
      }
    }

    if (!fileId) {
      return NextResponse.json({ error: "Missing file ID" }, { status: 400 });
    }

    const drive = getDriveClient();

    // 3. Fetch file metadata to get the correct MIME type
    const meta = await drive.files.get({
      fileId: fileId,
      fields: "mimeType, name",
    });

    const mimeType = meta.data.mimeType || "application/octet-stream";

    // 4. Fetch the file media stream
    const response = await drive.files.get(
      {
        fileId: fileId,
        alt: "media",
      },
      {
        responseType: "stream",
      }
    );

    const nodeStream = response.data as Readable;
    
    // Convert Node.js Readable stream to Web ReadableStream
    // @ts-ignore
    const webStream = Readable.toWeb(nodeStream);

    return new Response(webStream as any, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${meta.data.name || "file"}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Failed to proxy Google Drive file:", error);
    return NextResponse.json({ error: "Failed to load file" }, { status: 500 });
  }
}
