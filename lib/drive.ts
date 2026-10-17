import { google } from "googleapis";
import { Readable } from "stream";

let cachedDriveClient: ReturnType<typeof google.drive> | null = null;

export function getDriveClient() {
  if (cachedDriveClient) {
    return cachedDriveClient;
  }

  const saJsonB64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!saJsonB64) {
    return null;
  }

  let credentials;
  try {
    // Handle both base64-encoded and direct JSON string
    if (saJsonB64.trim().startsWith("{")) {
      credentials = JSON.parse(saJsonB64);
    } else {
      const decoded = Buffer.from(saJsonB64, "base64").toString("utf-8");
      credentials = JSON.parse(decoded);
    }
  } catch (err) {
    console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:", err);
    return null;
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  cachedDriveClient = google.drive({ version: "v3", auth });
  return cachedDriveClient;
}

/**
 * Streams file bytes directly from Google Drive using the service account.
 */
export async function getDriveFileStream(fileId: string, knownMimeType?: string): Promise<{
  stream: Readable;
  mimeType: string;
  size?: number;
} | null> {
  const drive = getDriveClient();
  if (!drive) {
    return null;
  }

  try {
    // Fast path: If MIME type is already known and not a proprietary Google Doc, fetch media directly
    if (knownMimeType && !knownMimeType.includes("vnd.google-apps")) {
      const response = await drive.files.get(
        {
          fileId,
          alt: "media",
          supportsAllDrives: true,
        },
        { responseType: "stream" }
      );

      return {
        stream: response.data as Readable,
        mimeType: knownMimeType,
      };
    }

    // Get file metadata first
    const meta = await drive.files.get({
      fileId,
      fields: "id, name, mimeType, size",
      supportsAllDrives: true,
    });

    const sourceMime = meta.data.mimeType || "application/pdf";

    // Native Google Docs must be exported
    if (sourceMime === "application/vnd.google-apps.document") {
      const response = await drive.files.export(
        {
          fileId,
          mimeType: "application/pdf",
        },
        { responseType: "stream" }
      );
      return {
        stream: response.data as Readable,
        mimeType: "application/pdf",
      };
    } else if (sourceMime === "application/vnd.google-apps.spreadsheet") {
      const response = await drive.files.export(
        {
          fileId,
          mimeType: "application/pdf",
        },
        { responseType: "stream" }
      );
      return {
        stream: response.data as Readable,
        mimeType: "application/pdf",
      };
    }

    const response = await drive.files.get(
      {
        fileId,
        alt: "media",
        supportsAllDrives: true,
      },
      { responseType: "stream" }
    );

    return {
      stream: response.data as Readable,
      mimeType: sourceMime,
      size: meta.data.size ? parseInt(meta.data.size, 10) : undefined,
    };
  } catch (err: any) {
    console.warn(`[getDriveFileStream] File "${fileId}" not found in Google Drive or access denied:`, err?.message || err);
    return null;
  }
}

/**
 * Lists subfolders inside the master folder (Categories).
 */
export async function listDriveSubfolders(parentFolderId: string) {
  const drive = getDriveClient();
  if (!drive) return [];

  const res = await drive.files.list({
    q: `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id, name)",
    pageSize: 100,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  return res.data.files || [];
}

/**
 * Lists files (PDFs) inside a category folder.
 */
export async function listDriveFolderFiles(folderId: string) {
  const drive = getDriveClient();
  if (!drive) return [];

  const res = await drive.files.list({
    q: `'${folderId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id, name, mimeType, size)",
    pageSize: 100,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  return res.data.files || [];
}
