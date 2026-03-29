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

export const raylsPublicChain = defineChain({
  id: 7295799,
  name: "Rayls Public Chain",
  nativeCurrency: {
    name: "USDr",
    symbol: "USDr",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["/api/rpc/public"],
    },
  },
  blockExplorers: {
    default: {
      name: "Rayls Explorer",
      url: "https://testnet-explorer.rayls.com",
    },
  },
  testnet: true,
});
