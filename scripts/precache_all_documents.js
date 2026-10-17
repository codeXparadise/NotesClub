const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');

// 1. Read environment variables from .env.local
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
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const CACHE_DIR = path.join(process.cwd(), '.cache', 'drive_files');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

async function precacheAll() {
  console.log('[Precache] Starting document pre-caching from Supabase & Google Drive...');
  
  const { data: docs, error } = await supabase
    .from('documents')
    .select('id, title, drive_file_id, mime_type')
    .eq('is_published', true);

  if (error || !docs) {
    console.error('[Precache] Failed to fetch documents:', error);
    return;
  }

  console.log(`[Precache] Found ${docs.length} published documents.`);
  
  let alreadyCached = 0;
  let newlyCached = 0;
  let failed = 0;

  // Process in small concurrency to avoid rate limits
  const concurrency = 4;
  for (let i = 0; i < docs.length; i += concurrency) {
    const chunk = docs.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async (doc) => {
        if (!doc.drive_file_id) return;
        const safeDriveId = doc.drive_file_id.replace(/[^a-zA-Z0-9_-]/g, '_');
        const binPath = path.join(CACHE_DIR, `${safeDriveId}.bin`);
        const metaPath = path.join(CACHE_DIR, `${safeDriveId}.meta.json`);

        if (fs.existsSync(binPath) && fs.existsSync(metaPath)) {
          alreadyCached++;
          return;
        }

        try {
          // Download directly using media stream
          const res = await drive.files.get(
            { fileId: doc.drive_file_id, alt: 'media', supportsAllDrives: true },
            { responseType: 'stream' }
          );

          const chunks = [];
          await new Promise((resolve, reject) => {
            res.data.on('data', (c) => chunks.push(Buffer.from(c)));
            res.data.on('end', resolve);
            res.data.on('error', reject);
          });

          const fullBuf = Buffer.concat(chunks);
          fs.writeFileSync(binPath, fullBuf);
          fs.writeFileSync(
            metaPath,
            JSON.stringify({
              mimeType: doc.mime_type || 'application/pdf',
              size: fullBuf.length,
              cachedAt: new Date().toISOString(),
              title: doc.title,
            })
          );
          newlyCached++;
          console.log(`[Cached] (${newlyCached}) ${doc.title.slice(0, 40)} [${(fullBuf.length / 1024).toFixed(1)} KB]`);
        } catch (err) {
          failed++;
          // Not critical, fallback is generated on demand
        }
      })
    );

    if ((i + concurrency) % 40 === 0 || i + concurrency >= docs.length) {
      console.log(`[Progress] Processed ${Math.min(i + concurrency, docs.length)} / ${docs.length} (Cached: ${alreadyCached + newlyCached}, Failed/Skipped: ${failed})`);
    }
  }

  console.log(`\n========================================`);
  console.log(`[Precache Complete]`);
  console.log(`Already Cached : ${alreadyCached}`);
  console.log(`Newly Cached   : ${newlyCached}`);
  console.log(`Failed/Missing : ${failed}`);
  console.log(`Total on Disk  : ${alreadyCached + newlyCached}`);
  console.log(`========================================\n`);
}

precacheAll().catch(console.error);
