import { defineChain } from "viem";

export const raylsPrivacyNode = defineChain({
  id: 800000,
  name: "Rayls Privacy Node",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_PRIVACY_NODE_RPC ||
          "https://privacy-node-0.rayls.com",
      ],
    },
  },
  testnet: true,
});
