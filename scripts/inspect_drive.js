const fs = require('fs');
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0 && !line.startsWith('#')) {
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    env[key] = val;
  }
});
const { google } = require('googleapis');

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

async function inspect() {
  const master = env.GOOGLE_DRIVE_FOLDER_ID;
  console.log('Master Folder ID:', master);
  const res = await drive.files.list({
    q: `'${master}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType)',
    pageSize: 100,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  console.log(`Found ${res.data.files.length} top-level items:`);
  for (const f of res.data.files) {
    console.log(`[${f.mimeType === 'application/vnd.google-apps.folder' ? 'DIR' : 'FILE'}] ${f.name} (id: ${f.id})`);
    if (f.mimeType === 'application/vnd.google-apps.folder') {
      const sub = await drive.files.list({
        q: `'${f.id}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType)',
        pageSize: 10,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      for (const s of sub.data.files) {
        console.log(`   -> [${s.mimeType === 'application/vnd.google-apps.folder' ? 'DIR' : 'FILE'}] ${s.name}`);
      }
    }
  }
}

inspect().catch(console.error);
