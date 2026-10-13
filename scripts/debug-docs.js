const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sqihjhyargpxtaoywues.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxaWhqaHlhcmdweHRhb3l3dWVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NzA1NzgsImV4cCI6MjEwNzA0NjU3OH0.11fxmRFM0dUr1IUcvAya5Hzu16AQhqV1Uv7oHnpKmPw';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxaWhqaHlhcmdweHRhb3l3dWVzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTQ3MDU3OCwiZXhwIjoyMTA3MDQ2NTc4fQ.8k6fqK4KUl6uM39RCH2BFKsjn6dOI2x1bPUlTATabkw';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
const supabaseStudent = createClient(supabaseUrl, anonKey);

async function debug() {
  console.log('1. Checking categories in DB...');
  const { data: cats, error: catErr } = await supabaseAdmin.from('categories').select('*');
  console.log('Categories count:', cats?.length, catErr || '');
  console.log(cats);

  console.log('\n2. Checking documents in DB...');
  const { data: docs, error: docErr } = await supabaseAdmin.from('documents').select('*');
  console.log('Documents count:', docs?.length, docErr || '');
  docs?.forEach(d => console.log(`- [${d.id}] ${d.title} (drive_file_id: ${d.drive_file_id}, category_id: ${d.category_id})`));

  console.log('\n3. Signing in as student and querying documents via RLS...');
  const { data: auth, error: authErr } = await supabaseStudent.auth.signInWithPassword({
    email: 'smartyvishalprajapati@gmail.com',
    password: '123456'
  });

  if (authErr) {
    console.error('Sign in error:', authErr);
    return;
  }

  const { data: studentDocs, error: sDocErr } = await supabaseStudent
    .from('documents')
    .select('id, title, categories(name)')
    .eq('is_published', true);

  console.log('Student visible documents count:', studentDocs?.length, sDocErr || '');
  studentDocs?.forEach(d => console.log(`- ${d.title} (${d.categories?.name})`));

  console.log('\n4. Testing Drive streaming for first doc...');
  if (docs && docs.length > 0) {
    const firstDoc = docs[0];
    console.log('Attempting drive get for drive_file_id:', firstDoc.drive_file_id);
  }
}

debug().catch(console.error);
