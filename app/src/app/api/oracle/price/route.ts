import { NextResponse } from "next/server";

const AGENT_URL = process.env.AGENT_URL || "http://localhost:3001";

export async function GET() {
  try {
    const res = await fetch(`${AGENT_URL}/api/oracle/price`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`Agent returned ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[oracle proxy] Error:", error.message);
    return NextResponse.json(
      { error: "Oracle unavailable", details: error.message },
      { status: 502 }
    );
  }
}
