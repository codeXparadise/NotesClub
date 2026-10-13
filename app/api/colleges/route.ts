import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface College {
  id: string;
  name: string;
  state: string;
  district: string;
}

let cachedColleges: College[] | null = null;

function loadColleges(): College[] {
  if (cachedColleges) return cachedColleges;
  try {
    const filePath = path.join(process.cwd(), "data", "colleges.json");
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf8");
      cachedColleges = JSON.parse(raw);
      return cachedColleges || [];
    }
  } catch (err) {
    console.error("Failed to load colleges data:", err);
  }
  return [];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") || "").trim().toLowerCase();
  const state = (searchParams.get("state") || "").trim().toLowerCase();
  const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "30", 10)), 100);

  const allColleges = loadColleges();

  if (!query && !state) {
    // Return sample colleges (first few popular ones or general slice)
    return NextResponse.json({
      total: allColleges.length,
      colleges: allColleges.slice(0, limit),
    });
  }

  const filtered = allColleges.filter((c) => {
    const matchesState = state ? c.state.toLowerCase() === state : true;
    if (!matchesState) return false;

    if (!query) return true;
    return (
      c.name.toLowerCase().includes(query) ||
      c.district.toLowerCase().includes(query) ||
      c.state.toLowerCase().includes(query)
    );
  });

  return NextResponse.json({
    total: filtered.length,
    colleges: filtered.slice(0, limit),
  });
}
