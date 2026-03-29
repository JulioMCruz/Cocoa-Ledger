import { NextResponse } from "next/server";

const MARKETPLACE_API = process.env.MARKETPLACE_URL || "http://46.225.67.25:3000";

export async function POST(req: Request, { params }: { params: Promise<{ tokenId: string }> }) {
  const { tokenId } = await params;
  try {
    const body = await req.json().catch(() => ({}));
    const res = await fetch(`${MARKETPLACE_API}/api/cacao-market/lot/${tokenId}/prepare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90000), // 90s for mint+bridge+relayer+list
    });
    if (!res.ok) throw new Error(`Marketplace returned ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Prepare failed", details: error.message },
      { status: 502 }
    );
  }
}
