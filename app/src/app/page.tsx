"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Shield,
  Eye,
  Brain,
  BadgeDollarSign,
  Leaf,
  ArrowRight,
  Cpu,
  Link2,
  ChevronDown,
} from "lucide-react";

const features = [
  {
    icon: Eye,
    title: "Full Traceability",
    description:
      "Track every cacao bean from farm to bar. IoT sensors capture temperature, humidity, soil data, and GPS coordinates in real-time.",
    accent: "from-emerald-500/20 to-emerald-500/5",
    iconColor: "text-emerald-400",
  },
  {
    icon: Shield,
    title: "Private Data",
    description:
      "Farm data is stored on Rayls Privacy Nodes. Producers control who sees their data — no public exposure of trade secrets.",
    accent: "from-blue-500/20 to-blue-500/5",
    iconColor: "text-blue-400",
  },
  {
    icon: Brain,
    title: "AI Quality Scoring",
    description:
      "Machine learning models analyze IoT data to predict cacao quality, fermentation outcomes, and optimal harvest timing.",
    accent: "from-purple-500/20 to-purple-500/5",
    iconColor: "text-purple-400",
  },
  {
    icon: BadgeDollarSign,
    title: "Fair Pricing",
    description:
      "On-chain quality certificates enable premium pricing for fine cacao. Producers earn what their beans are truly worth.",
    accent: "from-amber-500/20 to-amber-500/5",
    iconColor: "text-amber-400",
  },
];

const stats = [
  { value: "1,000+", label: "IoT Readings / Lot" },
  { value: "8", label: "Sensor Devices" },
  { value: "4", label: "Peru Regions" },
  { value: "100%", label: "On-Chain" },
];

export default function LandingPage() {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) {
      router.replace("/dashboard");
    }
  }, [isConnected, router]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 sm:h-9 sm:w-9">
              <Leaf className="h-4 w-4 text-emerald-400 sm:h-5 sm:w-5" />
            </div>
            <span className="text-base font-semibold tracking-tight sm:text-lg">
              Cocoa Ledger
            </span>
          </div>
          <ConnectButton
            chainStatus="none"
            accountStatus="avatar"
            showBalance={false}
            label="Join"
          />
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-16 sm:py-24">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/8 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-[300px] w-[400px] translate-x-1/4 translate-y-1/4 rounded-full bg-emerald-600/5 blur-[100px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          {/* Pill */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-xs font-medium text-emerald-400 sm:text-sm">
            <Cpu className="h-3.5 w-3.5" />
            IoT + Privacy Chain + AI
          </div>

          <h1 className="text-3xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
            Transparency for{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              Cacao
            </span>{" "}
            Supply Chains
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg">
            From the farms of Peru to your chocolate bar. Real-time IoT data,
            stored on a privacy-preserving blockchain, scored by AI — so every
            bean tells its story.
          </p>

          {/* CTA */}
          <div className="mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row sm:justify-center sm:gap-4">
            <button
              onClick={openConnectModal}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-8 text-sm font-semibold text-white transition-all hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] sm:h-13 sm:w-auto sm:text-base"
            >
              Connect Wallet
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <a
              href="#how-it-works"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border/50 px-8 text-sm font-medium text-muted-foreground transition-all hover:border-border hover:text-foreground sm:h-13 sm:w-auto sm:text-base"
            >
              Learn More
              <ChevronDown className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative z-10 mx-auto mt-16 grid w-full max-w-2xl grid-cols-2 gap-3 sm:mt-20 sm:grid-cols-4 sm:gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center rounded-xl border border-border/30 bg-card/30 px-4 py-4 text-center backdrop-blur-sm"
            >
              <span className="text-2xl font-bold tracking-tight text-emerald-400 sm:text-3xl">
                {stat.value}
              </span>
              <span className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground sm:text-xs">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="border-t border-border/30 bg-card/20 px-4 py-16 sm:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              How It Works
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
              Four pillars that bring trust and transparency to fine cacao
              production.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/40 p-5 transition-all hover:border-emerald-500/30 hover:bg-card/60 sm:p-7"
              >
                {/* Number */}
                <span className="absolute right-4 top-4 font-mono text-6xl font-bold leading-none text-muted/30 sm:text-7xl">
                  {i + 1}
                </span>

                <div
                  className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${feature.accent} sm:h-12 sm:w-12`}
                >
                  <feature.icon className={`h-5 w-5 ${feature.iconColor} sm:h-6 sm:w-6`} />
                </div>

                <h3 className="text-base font-semibold sm:text-lg">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture strip */}
      <section className="border-t border-border/30 px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-center sm:gap-4">
            {[
              { icon: Cpu, label: "IoT Sensors" },
              { icon: Link2, label: "Privacy Node" },
              { icon: Brain, label: "AI Scoring" },
              { icon: Shield, label: "NFT Certificate" },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/40 px-4 py-2.5">
                  <step.icon className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-medium">{step.label}</span>
                </div>
                {i < 3 && (
                  <ArrowRight className="hidden h-4 w-4 text-muted-foreground/40 sm:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-border/30 px-4 py-16 text-center sm:py-24">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Ready to Track Your Cacao?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
            Connect your wallet and start storing IoT data on the Rayls Privacy
            Node today.
          </p>
          <button
            onClick={openConnectModal}
            className="group mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-emerald-600 px-8 text-sm font-semibold text-white transition-all hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] sm:h-13 sm:text-base"
          >
            Get Started
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
            <div className="flex items-center gap-2">
              <Leaf className="h-4 w-4 text-emerald-500/60" />
              <span className="text-xs text-muted-foreground/60">
                Cocoa Ledger © 2026
              </span>
            </div>
            <p className="text-xs text-muted-foreground/40">
              Built on{" "}
              <span className="text-emerald-500/60">Rayls Privacy Node</span>{" "}
              · Hackathon 2026
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
