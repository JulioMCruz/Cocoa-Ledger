import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { raylsPrivacyNode } from "./chain";

export const wagmiConfig = getDefaultConfig({
  appName: "Cocoa Ledger",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "placeholder",
  chains: [raylsPrivacyNode],
  ssr: true,
});
