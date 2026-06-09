import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Readable } from "stream";
import { getDriveClient, getOrCreateFolder } from "@/lib/googleDrive";

export async function POST(request: Request) {
  try {
    // 1. Authenticate user session
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse FormData
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const rhk = formData.get("rhk") as string | null;
    const year = formData.get("year") as string | null;
    const month = formData.get("month") as string | null;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const filename = file.name;
    const mimeType = file.type;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Authenticate and Upload to Google Drive using OAuth 2.0
    try {
      const drive = getDriveClient();
      let currentParentId = process.env.GOOGLE_DRIVE_FOLDER_ID || "root";

      // 3.1. Get or Create User Folder: "Name (Email)" or "Email"
      const userName = session.user.name || "";
      const userEmail = session.user.email || "";
      const userFolderName = userName 
        ? `${userName} (${userEmail})`.trim() 
        : (userEmail || "Unknown User").trim();
      
      currentParentId = await getOrCreateFolder(drive, userFolderName, currentParentId);

      // 3.2. Get or Create Year Folder
      const uploadYear = (year || new Date().getFullYear().toString()).trim();
      currentParentId = await getOrCreateFolder(drive, uploadYear, currentParentId);

      // 3.3. Get or Create Month Folder
      const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];
      const uploadMonth = (month || months[new Date().getMonth()]).trim();
      currentParentId = await getOrCreateFolder(drive, uploadMonth, currentParentId);

      // 3.4. Get or Create RHK Folder
      const rawRhkName = rhk || "Lain-lain";
      // Normalize whitespace and newlines, then truncate if too long
      let rhkFolderName = rawRhkName.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
      if (rhkFolderName.length > 100) {
        rhkFolderName = rhkFolderName.substring(0, 97) + "...";
      }

      currentParentId = await getOrCreateFolder(drive, rhkFolderName, currentParentId);

      // Convert buffer to Readable stream
      const mediaStream = new Readable();
      mediaStream.push(buffer);
      mediaStream.push(null);

      // Upload file
      const fileMetadata = {
        name: filename,
        parents: [currentParentId],
      };

      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: {
          mimeType: mimeType,
          body: mediaStream,
        },
        fields: "id, name, webViewLink",
      });

      const fileId = response.data.id;
      const webViewLink = response.data.webViewLink;

      if (!fileId || !webViewLink) {
        throw new Error("Failed to retrieve file details from Google Drive response.");
      }

      // Set permission to anyone:reader (make it public so others can view evidence)
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });

      console.log(`Successfully uploaded file "${filename}" to Google Drive folder "${userFolderName}/${uploadYear}/${uploadMonth}/${rhkFolderName}". ID: ${fileId}`);
      return NextResponse.json({
        success: true,
        url: webViewLink,
        name: filename,
        driveFileId: fileId,
      });
    } catch (driveError) {
      console.error("Google Drive upload failed:", driveError);
      const errorMessage = driveError instanceof Error ? driveError.message : String(driveError);
      return NextResponse.json({
        error: `Google Drive upload failed: ${errorMessage}`
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
