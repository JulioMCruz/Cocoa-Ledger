"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Leaf, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useBalance } from "wagmi";

function USDrBalance() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address,
    chainId: 7295799,
    query: { enabled: isConnected && !!address, refetchInterval: 15000 },
  });

  if (!isConnected || !balance) return null;

  const formatted = parseFloat(balance.formatted).toFixed(4);

  return (
    <div className="hidden sm:flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1">
      <span className="text-[10px] text-amber-400/70 font-medium">USDr</span>
      <span className="text-xs font-mono font-semibold text-amber-400">
        {formatted}
      </span>
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const isMarketplace = pathname === "/marketplace";
  const isDashboard = pathname === "/dashboard";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15">
              <Leaf className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold leading-tight tracking-tight sm:text-lg">
                Cocoa Ledger
              </span>
              <span className="hidden text-[11px] leading-tight text-muted-foreground sm:block">
                IoT Data on Privacy Chain
              </span>
            </div>
          </Link>
          <nav className="hidden sm:flex items-center gap-1 ml-4">
            <Link
              href="/dashboard"
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isDashboard
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              🌡️ Farm
            </Link>
            <Link
              href="/marketplace"
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                isMarketplace
                  ? "bg-amber-500/15 text-amber-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <ShoppingCart className="h-3 w-3" />
              Marketplace
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <USDrBalance />
          <ConnectButton
            chainStatus="icon"
            accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
            showBalance={false}
          />
        </div>
      </div>
    </header>
  );
}
