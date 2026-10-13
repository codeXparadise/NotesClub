const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0 && !line.startsWith('#')) {
    env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
});
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: cats } = await sb.from('categories').select('id, name').order('name');
  const topLevels = new Set();
  const subMap = {};
  cats?.forEach(c => {
    const parts = c.name.split(' / ');
    const top = parts[0];
    topLevels.add(top);
    if (!subMap[top]) subMap[top] = [];
    if (parts.length > 1) {
      subMap[top].push(c.name);
    }
  });
  console.log('Top level count:', topLevels.size);
  console.log('Top level categories:', Array.from(topLevels));
  for (const top of topLevels) {
    console.log(`\n=== ${top} (subcategories: ${subMap[top].length}) ===`);
    subMap[top].slice(0, 15).forEach(s => console.log('  -', s));
    if (subMap[top].length > 15) {
      console.log(`  ... and ${subMap[top].length - 15} more`);
    }
  }
}

main().catch(console.error);
