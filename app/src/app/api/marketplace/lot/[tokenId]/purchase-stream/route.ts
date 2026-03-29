import { NextRequest } from "next/server";

const MARKETPLACE_API = process.env.MARKETPLACE_URL || process.env.AGENT_URL?.replace(":3001", ":3000") || "http://46.225.67.25:3000";

export async function GET(req: NextRequest, { params }: { params: Promise<{ tokenId: string }> }) {
  const { tokenId } = await params;
  const buyer = req.nextUrl.searchParams.get("buyer") || "";

  const upstream = await fetch(
    `${MARKETPLACE_API}/api/cacao-market/lot/${tokenId}/purchase-stream?buyer=${buyer}`,
    { signal: AbortSignal.timeout(120000) }
  );

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
