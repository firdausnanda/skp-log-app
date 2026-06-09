import { google, drive_v3 } from "googleapis";

export function getDriveClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing Google Drive OAuth 2.0 configuration (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN must be set)."
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  return google.drive({ version: "v3", auth: oauth2Client });
}

export async function getOrCreateFolder(
  drive: drive_v3.Drive,
  folderName: string,
  parentId: string
): Promise<string> {
  const safeFolderName = folderName.replace(/'/g, "\\'");
  const query = `name = '${safeFolderName}' and mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and trashed = false`;

  const res = await drive.files.list({
    q: query,
    fields: "files(id)",
    spaces: "drive",
  });

  const files = res.data.files || [];
  if (files.length > 0 && files[0].id) {
    return files[0].id!;
  }

  // Create folder
  const folderMetadata = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
    parents: [parentId],
  };

  const folderResponse = await drive.files.create({
    requestBody: folderMetadata,
    fields: "id",
  });

  const folderId = folderResponse.data.id;
  if (!folderId) {
    throw new Error(`Failed to create folder "${folderName}"`);
  }

  // Make the folder publicly readable so files uploaded inside are accessible
  try {
    await drive.permissions.create({
      fileId: folderId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });
  } catch (permError) {
    console.error(`Warning: Failed to set public permission on folder "${folderName}":`, permError);
  }

  return folderId;
}
