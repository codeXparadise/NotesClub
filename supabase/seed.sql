-- ========================================================
-- Notes Club: Seed Data for Local Development and Testing
-- ========================================================

-- Insert Sample Courses
INSERT INTO public.courses (id, name, code)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Computer Science & Engineering', 'CSE-2026'),
  ('c1000000-0000-0000-0000-000000000002', 'Information Technology', 'IT-2026'),
  ('c1000000-0000-0000-0000-000000000003', 'Electronics & Communication', 'ECE-2026'),
  ('c1000000-0000-0000-0000-000000000004', 'First Year B.Sc. Artificial Intelligence', 'FYBSCAI')
ON CONFLICT (code) DO NOTHING;

-- Insert Sample Categories (Matching Drive Folders)
INSERT INTO public.categories (id, name, drive_folder_id, sort_order)
VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Data Structures & Algorithms', 'folder_dsa_01', 1),
  ('a1000000-0000-0000-0000-000000000002', 'Operating Systems', 'folder_os_02', 2),
  ('a1000000-0000-0000-0000-000000000003', 'Database Management Systems', 'folder_dbms_03', 3),
  ('a1000000-0000-0000-0000-000000000004', 'System Design & Architecture', 'folder_sysdes_04', 4),
  ('a1000000-0000-0000-0000-000000000005', 'Web Development & Next.js', 'folder_webdev_05', 5)
ON CONFLICT (drive_folder_id) DO NOTHING;

-- Sample Documents (PDFs)
INSERT INTO public.documents (
  id, drive_file_id, title, description, category_id, course_id, mime_type,
  size_bytes, page_count, cover_url, is_published, is_featured
)
VALUES
  (
    'd1000000-0000-0000-0000-000000000001',
    'sample_drive_pdf_dsa_trees',
    'DSA Handcrafted Notes: Binary Trees & Graphs',
    'Complete master guide covering Traversals, Segment Trees, BFS, DFS, and Dijkstra algorithms with visual diagrams.',
    'a1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'application/pdf',
    4285000,
    48,
    'https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?w=600&auto=format&fit=crop&q=80',
    true,
    true
  ),
  (
    'd1000000-0000-0000-0000-000000000002',
    'sample_drive_pdf_os_concurrency',
    'Operating Systems: Concurrency, Deadlocks & Paging',
    'Professor notes detailing Virtual Memory, Semaphores, Peterson Algorithm, and Kernel architectures.',
    'a1000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000001',
    'application/pdf',
    3120000,
    34,
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
    true,
    false
  ),
  (
    'd1000000-0000-0000-0000-000000000003',
    'sample_drive_pdf_dbms_indexing',
    'Database Engineering: B+ Trees, ACID & PostgreSQL Internals',
    'Comprehensive handwritten and typed notes on Write-Ahead Logging (WAL), MVCC, isolation levels and execution plans.',
    'a1000000-0000-0000-0000-000000000003',
    'c1000000-0000-0000-0000-000000000001',
    'application/pdf',
    5420000,
    62,
    'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&auto=format&fit=crop&q=80',
    true,
    true
  ),
  (
    'd1000000-0000-0000-0000-000000000004',
    'sample_drive_pdf_sys_design_primer',
    'High-Level System Design Primer',
    'Caching patterns, message queues (Kafka), distributed consensus (Raft), rate limiters, and scalable microservices.',
    'a1000000-0000-0000-0000-000000000004',
    NULL,
    'application/pdf',
    6890000,
    75,
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80',
    true,
    true
  )
ON CONFLICT (drive_file_id) DO NOTHING;

-- Sample Course-wide Grants so all students in CSE-2026 can read these documents
INSERT INTO public.access_grants (id, course_id, document_id, created_at)
VALUES
  ('e1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', now()),
  ('e1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000002', now()),
  ('e1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000003', now()),
  ('e1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000004', now())
ON CONFLICT DO NOTHING;

-- Sample System Announcements
INSERT INTO public.notifications (id, title, body, type, audience, created_at)
VALUES
  (
    'f1000000-0000-0000-0000-000000000001',
    'Welcome to Notes Club Semester Portal!',
    'All lecture notes and reference books have been uploaded to Google Drive and indexed here. Your reading progress syncs across your phone and laptop automatically.',
    'manual',
    'all',
    now()
  ),
  (
    'f1000000-0000-0000-0000-000000000002',
    'New Book Added: System Design Primer',
    'Comprehensive study guide on scalable distributed architectures has been published.',
    'auto',
    'all',
    now()
  )
ON CONFLICT DO NOTHING;
