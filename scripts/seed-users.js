const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sqihjhyargpxtaoywues.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxaWhqaHlhcmdweHRhb3l3dWVzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTQ3MDU3OCwiZXhwIjoyMTA3MDQ2NTc4fQ.8k6fqK4KUl6uM39RCH2BFKsjn6dOI2x1bPUlTATabkw';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function seed() {
  console.log('Connecting to Supabase...');

  // 1. Ensure course FYBSCAI exists
  console.log('1. Ensuring courses exist...');
  const { data: course, error: courseErr } = await supabase
    .from('courses')
    .upsert(
      {
        name: 'First Year B.Sc. Artificial Intelligence',
        code: 'FYBSCAI'
      },
      { onConflict: 'code' }
    )
    .select()
    .single();

  if (courseErr) {
    console.error('Error creating course FYBSCAI:', courseErr);
  } else {
    console.log('Course FYBSCAI ready:', course.id);
  }

  const courseId = course?.id;

  // 2. Create Admin Teacher User
  console.log('2. Creating Dummy Admin (Teacher)...');
  const adminEmail = 'admin@notesclub.edu';
  const adminPassword = 'AdminPass123';

  // Check if admin already exists
  const { data: existingAdminList } = await supabase.auth.admin.listUsers();
  let adminUser = existingAdminList.users.find(u => u.email === adminEmail);

  if (!adminUser) {
    const { data: createdAdmin, error: adminErr } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Professor Admin',
        role: 'teacher'
      }
    });

    if (adminErr) {
      console.error('Admin create error:', adminErr);
    } else {
      adminUser = createdAdmin.user;
      console.log('Admin user created in auth.users:', adminUser.id);
    }
  } else {
    console.log('Admin user already exists:', adminUser.id);
    // update password just in case
    await supabase.auth.admin.updateUserById(adminUser.id, {
      password: adminPassword,
      email_confirm: true
    });
  }

  if (adminUser) {
    const { error: profErr } = await supabase.from('profiles').upsert(
      {
        id: adminUser.id,
        full_name: 'Professor Admin',
        email: adminEmail,
        role: 'teacher',
        is_blocked: false
      },
      { onConflict: 'id' }
    );
    if (profErr) console.error('Admin profile error:', profErr);
    else console.log('Admin profile upserted successfully as teacher.');
  }

  // 3. Create Student User: Vishal Prajapati
  console.log('3. Creating Student: Vishal Prajapati...');
  const studentEmail = 'smartyvishalprajapati@gmail.com';
  const studentPassword = '123456';
  const studentRoll = 'FDAI044A';
  const studentName = 'vishal prajapati';

  let studentUser = existingAdminList.users.find(u => u.email === studentEmail);

  if (!studentUser) {
    const { data: createdStudent, error: studentErr } = await supabase.auth.admin.createUser({
      email: studentEmail,
      password: studentPassword,
      email_confirm: true,
      user_metadata: {
        full_name: studentName,
        roll_number: studentRoll,
        course_id: courseId,
        role: 'student'
      }
    });

    if (studentErr) {
      console.error('Student create error:', studentErr);
    } else {
      studentUser = createdStudent.user;
      console.log('Student created in auth.users:', studentUser.id);
    }
  } else {
    console.log('Student user already exists:', studentUser.id);
    await supabase.auth.admin.updateUserById(studentUser.id, {
      password: studentPassword,
      email_confirm: true
    });
  }

  if (studentUser) {
    const { error: profErr } = await supabase.from('profiles').upsert(
      {
        id: studentUser.id,
        full_name: studentName,
        roll_number: studentRoll,
        course_id: courseId,
        email: studentEmail,
        role: 'student',
        is_blocked: false
      },
      { onConflict: 'id' }
    );
    if (profErr) console.error('Student profile error:', profErr);
    else console.log('Student profile upserted successfully.');
  }

  // 4. Grant access to FYBSCAI course so this student sees all documents
  console.log('4. Granting FYBSCAI course-wide access...');
  if (courseId) {
    const { data: docs } = await supabase.from('documents').select('id');
    if (docs && docs.length > 0) {
      for (const doc of docs) {
        await supabase.from('access_grants').upsert(
          {
            course_id: courseId,
            document_id: doc.id
          },
          { onConflict: 'id' }
        );
      }
      console.log(`Granted access for course FYBSCAI to ${docs.length} documents.`);
    }
  }

  console.log('--- SEED COMPLETED ---');
}

seed().catch(console.error);
