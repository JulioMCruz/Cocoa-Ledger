import { NextRequest, NextResponse } from "next/server";

const AGENT_URL = process.env.AGENT_URL || "http://46.225.67.25:3001";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${AGENT_URL}/api/dispute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
