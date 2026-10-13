const fs = require('fs');
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0 && !line.startsWith('#')) {
    env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
});

const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');
const { createClient: createRedisClient } = require('redis');

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

const usedSlugs = new Set();

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\.[^/.]+$/, '') // strip extension
    .replace(/[^\w\s-]/g, '') // remove special chars
    .replace(/[\s_-]+/g, '-') // collapse spaces/underscores to hyphens
    .replace(/^-+|-+$/g, '') || 'note';
}

function getUniqueSlug(fileName) {
  let baseSlug = slugify(fileName);
  let finalSlug = baseSlug;
  let counter = 2;
  while (usedSlugs.has(finalSlug)) {
    finalSlug = `${baseSlug}-${counter}`;
    counter++;
  }
  usedSlugs.add(finalSlug);
  return finalSlug;
}

function getMimeType(fileName, driveMime) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.docx') || lower.endsWith('.doc')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.csv')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (lower.endsWith('.md')) return 'text/markdown';
  if (lower.endsWith('.txt')) return 'text/plain';
  if (lower.endsWith('.htm') || lower.endsWith('.html')) return 'text/html';
  return driveMime || 'application/pdf';
}

async function run() {
  console.log('--- STARTING HIGH-SPEED SYSTEMATIC RE-SYNC FOR ALL 12 COLLECTIONS ---');
  const masterFolderId = env.GOOGLE_DRIVE_FOLDER_ID;

  // 1. Purge old records cleanly
  console.log('Purging previous records...');
  await supabase.from('view_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('reading_progress').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Purge completed.');

  // 2. Fetch course ID
  const { data: course } = await supabase.from('courses').select('id').limit(1).maybeSingle();
  const courseId = course?.id || 'b22ae884-83a8-4aef-a710-cddb1af60854';

  // 3. Top-level folders in Google Drive
  const topRes = await drive.files.list({
    q: `'${masterFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    pageSize: 100,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const topFolders = topRes.data.files || [];
  console.log(`Discovered ${topFolders.length} top-level collections:`, topFolders.map(f => f.name));

  let totalCategories = 0;
  let totalDocs = 0;
  const categoryCache = new Map();

  async function ensureCategory(folderId, pathName, sortOrder = 10) {
    if (categoryCache.has(folderId)) {
      return categoryCache.get(folderId);
    }
    const { data: cat, error } = await supabase
      .from('categories')
      .upsert({
        name: pathName,
        drive_folder_id: folderId,
        sort_order: sortOrder,
      }, { onConflict: 'drive_folder_id' })
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', pathName, error.message);
      return null;
    }
    categoryCache.set(folderId, cat.id);
    totalCategories++;
    return cat.id;
  }

  async function crawlFolder(folderId, folderName, pathPrefix, rootCollectionName, depth = 0) {
    const currentPath = pathPrefix ? `${pathPrefix} / ${folderName}` : folderName;
    console.log(`[Indexing] ${currentPath}`);

    const catId = await ensureCategory(folderId, currentPath, depth * 10);

    // List files (pagesize up to 1000)
    let pageToken = undefined;
    do {
      const filesRes = await drive.files.list({
        q: `'${folderId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'nextPageToken, files(id, name, mimeType, size)',
        pageSize: 500,
        pageToken,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      const files = filesRes.data.files || [];
      const docInserts = [];

      for (const f of files) {
        if (!f.id || !f.name) continue;

        // CRITICAL: DO NOT SHORTEN BOOK NAME: preserve full clean title
        const rawTitle = f.name;
        const cleanTitle = rawTitle.replace(/\.[^/.]+$/, '').trim();
        const slug = getUniqueSlug(rawTitle);
        const mime = getMimeType(f.name, f.mimeType);
        const sizeBytes = f.size ? parseInt(f.size, 10) : 1024 * 512;

        let pageCount = Math.max(1, Math.min(600, Math.round(sizeBytes / (55 * 1024))));
        if (!f.name.toLowerCase().endsWith('.pdf')) {
          pageCount = 1;
        }

        // Store clean slug and root collection tag for instant queries
        const description = `slug:${slug} | root:${rootCollectionName} | path:${currentPath}`;

        docInserts.push({
          drive_file_id: f.id,
          title: cleanTitle,
          description: description,
          category_id: catId,
          course_id: courseId,
          mime_type: mime,
          size_bytes: sizeBytes,
          page_count: pageCount,
          is_published: true,
          is_featured: false,
          show_watermark: true,
          allow_download: false,
        });
      }

      if (docInserts.length > 0) {
        // Upsert in chunks of 100 to avoid request size limits
        for (let i = 0; i < docInserts.length; i += 100) {
          const chunk = docInserts.slice(i, i + 100);
          const { error: batchErr } = await supabase.from('documents').upsert(chunk, { onConflict: 'drive_file_id' });
          if (batchErr) {
            console.error('Batch insert error in', folderName, batchErr.message);
          } else {
            totalDocs += chunk.length;
          }
        }
        console.log(`  -> Inserted ${docInserts.length} files in [${folderName}]`);
      }

      pageToken = filesRes.data.nextPageToken;
    } while (pageToken);

    // Skip deeply nested directories in boilerplate tutorial projects
    if (folderName.toLowerCase().includes('html-css-javascript-projects') || depth >= 4) {
      return;
    }

    // List subfolders
    const subRes = await drive.files.list({
      q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name)',
      pageSize: 100,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const subFolders = subRes.data.files || [];
    for (const sub of subFolders) {
      // Skip hidden / system folders
      if (sub.name.startsWith('.') || sub.name === 'node_modules') continue;
      await crawlFolder(sub.id, sub.name, currentPath, rootCollectionName, depth + 1);
    }
  }

  for (let i = 0; i < topFolders.length; i++) {
    const top = topFolders[i];
    await crawlFolder(top.id, top.name, '', top.name, 0);
  }

  // Ensure course-wide access grant exists
  console.log('Ensuring course-wide access grant for FYBSCAI...');
  await supabase.from('access_grants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('access_grants').insert({
    course_id: courseId,
    granted_by: 'a81e2ea9-8b6a-4cdf-a710-9e110cb45255',
  });

  // Flush Redis cache
  try {
    const redis = createRedisClient({
      username: 'default',
      password: env.REDIS_PASSWORD || 'zQwGO4v8E9S3xxZ8m3DQlgDUAJqS46zZ',
      socket: {
        host: env.REDIS_HOST || 'better-hypersoft-potato-25997.db.redis.io',
        port: parseInt(env.REDIS_PORT || '17082', 10),
      },
    });
    await redis.connect();
    const keys = await redis.keys('notes_club:*');
    if (keys.length > 0) {
      await redis.del(keys);
      console.log('Flushed Redis cache keys:', keys.length);
    }
    await redis.disconnect();
  } catch (re) {
    console.warn('Redis flush error:', re.message);
  }

  console.log('=== SYNC SUCCESSFUL ===');
  console.log(`Categories Created: ${totalCategories}`);
  console.log(`Documents Synced: ${totalDocs}`);
}

run().catch(console.error);
