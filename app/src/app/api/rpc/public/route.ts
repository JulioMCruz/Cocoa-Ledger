import { NextResponse } from "next/server";

const PUBLIC_CHAIN_RPC = "https://testnet-rpc.rayls.com";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const res = await fetch(PUBLIC_CHAIN_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout(30000),
    });
    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return NextResponse.json(
      { jsonrpc: "2.0", error: { code: -32000, message: error.message }, id: null },
      { status: 502 }
    );
  }
}
