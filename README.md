# 📚 Notes Club — Study Materials & Protected Reader Portal

A production-quality web application built for teachers and students. Teachers maintain lecture notes, textbooks, and study guides in a **Google Drive** folder, while students browse a **flat, search-first catalog** and read materials inside an **authenticated, watermarked reader** that saves and resumes their reading page across Android phones and laptops.

Built with **Next.js (App Router) + TypeScript**, **Supabase (Auth + Postgres + RLS)**, and **Google Drive API (Service Account)** with a target recurring infrastructure cost of **₹0/month**.

---

## 🚀 Key Features

- **📱 Mobile-First & Android-Optimized:** Fast touch navigation, responsive high-DPI canvas viewer, zero layout shifts.
- **🔍 Search-First Catalogue:** Real-time debounced title and tag search powered by Postgres full-text (`tsvector`) and trigram matching (`pg_trgm`). Non-matching books are cleanly filtered out.
- **🛡️ Protected Watermarked Reader:**
  - PDF.js renders to a HTML5 `<canvas>` (never an `<embed>` or `<iframe>` PDF).
  - Multi-diagonal semi-transparent watermark dynamically embedded on every page with the student's name, roll number, email, and timestamp.
  - Right-click menu and shortcuts (`Ctrl+P`, `Ctrl+S`, `Ctrl+U`, `F12`, `PrintScreen`) suppressed.
  - Short-lived HMAC signed tokens (60 seconds) bound to the student ID protect the streaming endpoint (`/api/file/:id`).
- **🔖 Server-Side Cross-Device Resume:** Page position is debounced and synchronized to `reading_progress` table so a student can switch between an Android phone and a laptop and immediately resume reading from the exact page left.
- **🔔 Announcements & Automatic Events:** Notifications hub for teacher announcements and automated triggers when new notes are added. Unread badge syncs between Home and the reader.
- **👨‍🏫 Teacher / Admin Console:**
  - **Content:** Publish/unpublish, feature notes on Home, manage categories.
  - **Sharing:** Granular access grants per course batch or specific student with optional expiration dates.
  - **Roster:** List enrolled students, filter by course/roll, block/unblock (instant revocation of access), soft-delete.
  - **Analytics & Gap Finder:** Bar charts of most-read categories, daily reading velocity, and a **zero-result search gap finder** showing topics students search for that don't exist yet.
- **🔒 True Database-Level RBAC:** Every table enforces Supabase Postgres **Row-Level Security (RLS)** with default deny. Ungranted books cannot be accessed even via direct API calls.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router) + TypeScript (Strict) |
| **Styling** | Tailwind CSS + custom tokens |
| **Backend & DB** | Supabase Postgres with Row-Level Security (RLS) |
| **Authentication** | Supabase Auth (Email/Password, Magic Link, Google OAuth) |
| **File Storage** | Google Drive via Service Account (Server-side proxy) |
| **PDF Reader** | PDF.js rendered directly to `<canvas>` |
| **Search Engine** | Postgres `tsvector` with weighted search triggers + `pg_trgm` |
| **Hosting** | Vercel (Hobby ₹0 tier) |

---

## 📂 Project Structure

```
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx         # Password, Magic Link, Google OAuth & Demo buttons
│   │   └── register/page.tsx      # Student signup with unique roll number check
│   ├── (student)/
│   │   ├── home/page.tsx          # Continue reading row, search bar, category chips, book grid
│   │   ├── notifications/page.tsx # Announcements list & mark-all-as-read
│   │   ├── read/[id]/page.tsx     # Secure watermarked reader route
│   │   └── search/page.tsx        # Search redirect
│   ├── (admin)/
│   │   ├── admin/layout.tsx       # Instructor sidebar & mobile bottom bar
│   │   ├── admin/page.tsx         # Dashboard overview, quick stats & audit feed
│   │   ├── admin/notes/page.tsx   # Study note publisher & category editor
│   │   ├── admin/sharing/page.tsx # Batch & student access grant management
│   │   ├── admin/users/page.tsx   # Student roster with instant block/unblock
│   │   └── admin/analytics/page.tsx # Category views chart & zero-search gap finder
│   ├── api/
│   │   ├── documents/             # Catalogue search & metadata
│   │   ├── file/[id]/             # Authenticated byte stream proxy with signed HMAC tokens
│   │   ├── progress/              # Cross-device resume upsert & query
│   │   ├── notifications/         # Notification feeds & read states
│   │   ├── sync/drive/            # Scheduled Google Drive sync route
│   │   └── admin/...              # Teacher management routes
│   ├── globals.css                # Custom theme variables & protection styles
│   └── layout.tsx                 # Root layout with Inter font
├── components/
│   ├── reader/
│   │   ├── PdfViewer.tsx          # High-DPI canvas renderer with zoom, jump-page & shortcuts guard
│   │   └── Watermark.tsx          # Dynamic repeating diagonal security watermark overlay
│   ├── student/
│   │   └── Navbar.tsx             # Sticky mobile-first header with unread badge
│   └── ui/                        # Reusable accessible UI components
├── lib/
│   ├── auth.ts                    # RBAC session & role guards
│   ├── drive.ts                   # Google Drive API v3 client using Service Account
│   ├── token.ts                   # Short-lived HMAC token signing & verification
│   └── supabase/                  # SSR, Browser, and Admin service role clients
└── supabase/
    ├── migrations/
    │   └── 20261008000000_init_notes_club.sql # Complete DB schema, RLS policies, triggers
    ├── seed.sql                   # Sample courses, categories, documents & grants
    └── functions/sync-drive/      # Scheduled Deno Edge Function for Drive sync
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key used by Edge functions & Drive sync (never sent to client) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Base64-encoded string of Google Cloud Service Account JSON credentials |
| `GOOGLE_DRIVE_FOLDER_ID` | Folder ID of the master notes folder on Google Drive |
| `DRIVE_SYNC_SECRET` | Secret token protecting the `/api/sync/drive` webhook |
| `SIGNED_TOKEN_SECRET` | 32+ character HMAC key used for signing 60s stream tokens |

---

## 🗄️ Database Setup & Row-Level Security (RLS)

1. Open your Supabase SQL Editor.
2. Run `supabase/migrations/20261008000000_init_notes_club.sql`.
3. (Optional) Run `supabase/seed.sql` to populate sample departments, categories, and test notes.

### How RLS Works

- **Default Deny:** All tables (`documents`, `profiles`, `reading_progress`, `access_grants`, `view_logs`) have RLS enabled with default deny.
- **Documents Policy:** A student can only see a document if:
  1. `is_published = true`
  2. The student's account is active (`is_blocked = false`).
  3. A valid grant exists in `access_grants` linking either the student's ID or their enrolled `course_id` to that document.
- **Teacher Policy:** Teachers (checked via `role = 'teacher'`) can view and manage all tables.
- **Reading Progress:** Strictly isolated so each student can only read and write their own reading positions.

---

## 🔄 How the Google Drive Sync Works

1. Create a Google Cloud Service Account and enable the **Google Drive API**.
2. Share the master Google Drive folder with the service account email (as **Viewer**).
3. Organize the Drive folder with top-level subfolders representing **Categories** (e.g., `Data Structures`, `Operating Systems`).
4. Place PDFs inside those subfolders.
5. Trigger sync via:
   ```bash
   curl -X POST https://your-domain.vercel.app/api/sync/drive \
     -H "Authorization: Bearer YOUR_DRIVE_SYNC_SECRET"
   ```
6. The sync route scans folders, creates categories, indexes documents with metadata, and automatically issues a notification to students.

---

## 🛡️ Content Protection & Watermarking Deterrents

### What is Achieved
1. **No direct Drive URLs:** Students never receive raw Google Drive download links. Files are streamed exclusively through the server proxy.
2. **Short-lived signed tokens:** File access requires an HMAC token valid for only 60 seconds and tied strictly to the student's ID and document ID.
3. **Canvas-only rendering:** PDF is decoded into raw raster frames on an HTML5 `<canvas>`. Standard browser PDF viewer menus (Download/Print) do not exist.
4. **Overlay watermark:** Every canvas page is covered with a semi-transparent repeating diagonal pattern identifying the student's name, roll number, and timestamp.
5. **Shortcut & context menu suppression:** Right-click context menus, `Ctrl+P`, `Ctrl+S`, `Ctrl+U`, and `F12` inspect shortcuts are disabled.
6. **Audit trail:** Page visits and reading activity are recorded in `view_logs`.

### Honest Web Limitations
Web browsers cannot block hardware OS screenshots (e.g., Windows Snipping Tool or Android screenshot keys) or external screen recorders without a native application layer. Watermarking acts as the deterrent backstop. For absolute hardware-level DRM and screenshot prevention, the app includes a seam to wrap with Capacitor and enable Android `FLAG_SECURE`.

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start local Next.js dev server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to open Notes Club.
