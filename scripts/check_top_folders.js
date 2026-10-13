const fs = require('fs');
const { google } = require('googleapis');
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0 && !line.startsWith('#')) {
    env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
});

let sa;
if (env.GOOGLE_SERVICE_ACCOUNT_JSON.trim().startsWith('{')) {
  sa = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
} else {
  sa = JSON.parse(Buffer.from(env.GOOGLE_SERVICE_ACCOUNT_JSON, 'base64').toString('utf-8'));
}

const auth = new google.auth.GoogleAuth({
  credentials: sa,
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});
const drive = google.drive({ version: 'v3', auth });

async function check() {
  const masterFolderId = env.GOOGLE_DRIVE_FOLDER_ID;
  const res = await drive.files.list({
    q: `'${masterFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    pageSize: 100,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  console.log('Top folders in Google Drive:');
  res.data.files?.forEach(f => console.log(' - ', f.name, `(${f.id})`));
}

check().catch(console.error);
