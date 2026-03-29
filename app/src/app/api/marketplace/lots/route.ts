import { NextResponse } from "next/server";

const MARKETPLACE_API = process.env.MARKETPLACE_URL || process.env.AGENT_URL?.replace(":3001", ":3000") || "http://46.225.67.25:3000";

export async function GET() {
  try {
    const res = await fetch(`${MARKETPLACE_API}/api/cacao-market/lots`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`Marketplace returned ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Marketplace unavailable", details: error.message },
      { status: 502 }
    );
  }
}
