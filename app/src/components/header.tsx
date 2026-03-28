"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Leaf } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
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
        </div>

        <ConnectButton
          chainStatus="icon"
          accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
          showBalance={false}
        />
      </div>
    </header>
  );
}
