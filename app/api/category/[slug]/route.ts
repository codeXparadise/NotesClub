import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cacheGet, cacheSet } from "@/lib/redis";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Canonical mapping of top-level collections
const ROOT_COLLECTIONS = [
  "Semester Notes",
  "DSA",
  "Resume & Career",
  "Projects",
  "Resources",
  "Tools & Shortcuts",
  "Roadmaps",
  "Handwritten Notes",
  "Cheat Sheets",
  "Interview Prep",
  "E-Books",
  "Web Development",
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const cleanSlug = decodeURIComponent(slug).toLowerCase().trim();

    const cacheKey = `notes_club:category_view:${cleanSlug}`;
    const cached = await cacheGet<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "X-Cache": "HIT" },
      });
    }

    // 1. Find matching root collection
    const matchedRoot = ROOT_COLLECTIONS.find(
      (root) => slugify(root) === cleanSlug || root.toLowerCase() === cleanSlug
    );

    const rootName = matchedRoot || cleanSlug;
    const admin = createAdminClient();

    // 2. Fetch all categories starting with rootName
    const { data: catRows, error: catErr } = await admin
      .from("categories")
      .select("id, name, drive_folder_id, sort_order")
      .or(`name.eq.${rootName},name.ilike.${rootName} / %`)
      .order("sort_order", { ascending: true });

    if (catErr) {
      return NextResponse.json({ error: catErr.message }, { status: 500 });
    }

    const catIds = (catRows || []).map((c) => c.id);

    // 3. Fetch documents in these categories or with root:rootName
    let docQuery = admin
      .from("documents")
      .select(
        "id, title, description, category_id, mime_type, size_bytes, page_count, updated_at, categories(id, name)"
      )
      .eq("is_published", true)
      .order("title", { ascending: true });

    if (catIds.length > 0) {
      docQuery = docQuery.or(
        `category_id.in.(${catIds.join(",")}),description.ilike.%root:${rootName}%`
      );
    } else {
      docQuery = docQuery.ilike("description", `%root:${rootName}%`);
    }

    const { data: docRows, error: docErr } = await docQuery;

    if (docErr) {
      return NextResponse.json({ error: docErr.message }, { status: 500 });
    }

    // 4. Process documents & extract subcategories hierarchy
    const subcategorySet = new Set<string>();
    const subcategorySubjectsMap = new Map<string, Set<string>>();

    const processedDocs = (docRows || []).map((doc) => {
      // Parse description for slug and path
      let fileSlug = "";
      let path = "";

      if (doc.description) {
        const slugMatch = doc.description.match(/slug:([^|]+)/);
        if (slugMatch) fileSlug = slugMatch[1].trim();

        const pathMatch = doc.description.match(/path:([^|]+)/);
        if (pathMatch) path = pathMatch[1].trim();
      }

      if (!fileSlug) {
        fileSlug = slugify(doc.title);
      }

      // If path wasn't in description, check category name
      if (!path && (doc as any).categories?.name) {
        path = (doc as any).categories.name;
      }

      const pathSegments = path ? path.split(" / ") : [rootName];
      // segments: [root, subcategory?, subject?]
      const subcategory = pathSegments[1] || "General";
      const subject = pathSegments[2] || "";

      if (pathSegments[1]) {
        subcategorySet.add(pathSegments[1]);
        if (!subcategorySubjectsMap.has(pathSegments[1])) {
          subcategorySubjectsMap.set(pathSegments[1], new Set());
        }
        if (subject) {
          subcategorySubjectsMap.get(pathSegments[1])!.add(subject);
        }
      }

      return {
        id: doc.id,
        title: doc.title, // NEVER SHORTENED
        slug: fileSlug,
        path: path || rootName,
        subcategory: subcategory,
        subject: subject,
        mime_type: doc.mime_type,
        size_bytes: doc.size_bytes,
        page_count: doc.page_count,
        updated_at: doc.updated_at,
      };
    });

    // Structure subcategories with their subjects
    const subcategoriesList = Array.from(subcategorySet).sort().map((sub) => ({
      name: sub,
      slug: slugify(sub),
      count: processedDocs.filter((d) => d.subcategory === sub).length,
      subjects: Array.from(subcategorySubjectsMap.get(sub) || []).sort(),
    }));

    const responsePayload = {
      category: {
        name: rootName,
        slug: slugify(rootName),
        totalDocs: processedDocs.length,
        subcategories: subcategoriesList,
      },
      documents: processedDocs,
    };

    // Cache in Redis for 10 minutes
    await cacheSet(cacheKey, responsePayload, 600);

    return NextResponse.json(responsePayload, {
      headers: { "X-Cache": "MISS" },
    });
  } catch (err: any) {
    console.error("GET /api/category/[slug] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
