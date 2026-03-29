"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt, useSwitchChain } from "wagmi";
import { parseEther, encodeFunctionData } from "viem";
import { Header } from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { APP_VERSION } from "@/lib/constants";
import {
  ShoppingCart,
  Eye,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface CacaoLot {
  tokenId: number;
  variety: string;
  weight: string;
  status: string;
  harvest: string;
  aiScore: number;
  aiGrade: string;
  aiClassification: string;
  aiOrigin: string;
  aiPremium: string;
  aiConfidence: number;
  createdAt: string;
  iotReadings: unknown[];
}

interface RevealedData {
  region?: string;
  cooperativeName?: string;
  gps?: { lat?: number; lon?: number; area?: string };
  purchasePricePerKg?: string;
  flavorProfile?: Record<string, number>;
  anomalies?: unknown[];
  labQualityAnalysis?: string;
  producerRecommendations?: string;
  deviceStats?: unknown[];
  iotDataHash?: string;
  cropHealthAssessment?: string;
  avgTemperature?: number;
  avgHumidity?: number;
  avgSoilPH?: number;
  mintTxHash?: string;
  bridgeTxHash?: string;
  mintExplorer?: string;
  bridgeExplorer?: string;
  purchaseTxHash?: string;
  purchaseExplorer?: string;
}

const GRADE_COLORS: Record<string, string> = {
  S: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  A: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  B: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  C: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  D: "text-red-400 bg-red-500/10 border-red-500/30",
};

const GRADE_IMAGES: Record<string, string> = {
  S: "/nft/grade-s.svg",
  A: "/nft/grade-a.svg",
  B: "/nft/grade-b.svg",
  C: "/nft/grade-c.svg",
  D: "/nft/grade-d.svg",
};

export default function MarketplacePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <MarketplaceContent />
      </main>
      <footer className="mt-auto border-t border-border/30 py-4">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-muted-foreground sm:px-6">
          🏪 Cocoa Ledger Marketplace — Confidential NFT Trading ·
          Hackathon 2026 · <span className="font-mono">v{APP_VERSION}</span>
        </div>
      </footer>
    </div>
  );
}

const ATTESTATION_ADDRESS = "0x7f7508D693dFE7B490f1E41F40791d68d3BC0810";
const PURCHASE_PRICE = "0.001"; // 0.001 USDr

function MarketplaceContent() {
  const { address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { sendTransaction, data: txHash, isPending: isSending } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const [lots, setLots] = useState<CacaoLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLot, setSelectedLot] = useState<number | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [revealedData, setRevealedData] = useState<RevealedData | null>(null);
  const [purchaseTxHash, setPurchaseTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/marketplace/lots")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setLots(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // When TX confirms, reveal data
  useEffect(() => {
    if (isConfirmed && txHash && selectedLot !== null) {
      setPurchaseTxHash(txHash);
      // Now call backend to reveal the data
      fetch(`/api/marketplace/lot/${selectedLot}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerAddress: address, txHash }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.fullMetadata) {
            setRevealedData({
              ...data.fullMetadata,
              purchaseTxHash: txHash,
              purchaseExplorer: `https://testnet-explorer.rayls.com/tx/${txHash}`,
            } as RevealedData);
            setLots((prev) =>
              prev.map((l) =>
                l.tokenId === selectedLot ? { ...l, status: "revealed" } : l
              )
            );
          }
          setPurchasing(false);
        })
        .catch(() => setPurchasing(false));
    }
  }, [isConfirmed, txHash, selectedLot, address]);

  const handlePurchase = useCallback(
    async (tokenId: number) => {
      if (!address) {
        setError("Connect your wallet first");
        return;
      }

      // Switch to Public Chain if needed
      if (chainId !== 7295799) {
        try {
          switchChain({ chainId: 7295799 });
          // Wait a bit for chain switch
          await new Promise((r) => setTimeout(r, 2000));
        } catch {
          setError("Please switch to Rayls Public Chain (chain 7295799) in your wallet");
          return;
        }
      }

      setPurchasing(true);
      setError(null);
      setSelectedLot(tokenId);

      try {
        // Send real TX: 0.001 USDr to Attestation contract as purchase payment
        sendTransaction({
          to: ATTESTATION_ADDRESS as `0x${string}`,
          value: parseEther(PURCHASE_PRICE),
          chainId: 7295799,
        });
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Transaction failed");
        setPurchasing(false);
      }
    },
    [address, chainId, switchChain, sendTransaction]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        <span className="ml-3 text-muted-foreground">Loading marketplace...</span>
      </div>
    );
  }

  // If we have revealed data, show it
  if (revealedData && selectedLot !== null) {
    return (
      <RevealedView
        data={revealedData}
        tokenId={selectedLot}
        onBack={() => {
          setRevealedData(null);
          setSelectedLot(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🏪 Cacao NFT Marketplace</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse verified cacao lots. Purchase NFTs to unlock private farm data.
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Farmer Dashboard
          </Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
          <AlertCircle className="inline h-4 w-4 mr-2" />
          {error}
        </div>
      )}

      {lots.length === 0 ? (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-12 text-center text-muted-foreground">
            No cacao lots available yet. Process IoT data in the Farmer Dashboard first.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lots.map((lot) => (
            <LotCard
              key={lot.tokenId}
              lot={lot}
              onPurchase={handlePurchase}
              purchasing={purchasing && selectedLot === lot.tokenId}
              isSending={isSending}
              isConfirming={isConfirming}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LotCard({
  lot,
  onPurchase,
  purchasing,
  isSending,
  isConfirming,
}: {
  lot: CacaoLot;
  onPurchase: (tokenId: number) => void;
  purchasing: boolean;
  isSending: boolean;
  isConfirming: boolean;
}) {
  const isRevealed = lot.status === "revealed";
  const isRejected = lot.aiGrade === "D";
  const gradeClass = GRADE_COLORS[lot.aiGrade] || GRADE_COLORS.C;

  return (
    <Card className="border-border/50 bg-card/50 hover:border-emerald-500/30 transition-all overflow-hidden">
      {/* NFT Image */}
      <div className="relative">
        <img
          src={GRADE_IMAGES[lot.aiGrade] || GRADE_IMAGES.C}
          alt={`Cacao Lot #${lot.tokenId} - Grade ${lot.aiGrade}`}
          className="w-full h-auto"
        />
        <div className="absolute top-3 right-3">
          <div
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 backdrop-blur-sm ${gradeClass}`}
          >
            <span className="text-xl font-bold">{lot.aiGrade}</span>
            <span className="text-xs opacity-70">{lot.aiScore}/100</span>
          </div>
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="text-lg">🍫</span>
          <span className="font-semibold text-sm">Lot #{lot.tokenId}</span>
        </div>

        {/* Info */}
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>
            <span className="text-foreground font-medium">Variety:</span> {lot.variety}
          </p>
          <p>
            <span className="text-foreground font-medium">Volume:</span> {lot.weight}
          </p>
          <p>
            <span className="text-foreground font-medium">Harvest:</span> {lot.harvest}
          </p>
          <p>
            <span className="text-foreground font-medium">Classification:</span>{" "}
            {lot.aiClassification?.replace(/_/g, " ")}
          </p>
        </div>

        {/* Premium */}
        {lot.aiPremium && lot.aiPremium !== "0%" && (
          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">
            Premium: {lot.aiPremium}
          </Badge>
        )}

        {/* Private data indicator */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 border-t border-border/30 pt-2">
          {isRevealed ? (
            <>
              <Unlock className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400">Private data revealed</span>
            </>
          ) : (
            <>
              <Lock className="h-3 w-3" />
              <span>GPS, IoT details, price/kg — unlock with purchase</span>
            </>
          )}
        </div>

        {/* Action */}
        {isRevealed ? (
          <Button
            size="sm"
            className="w-full bg-emerald-600 hover:bg-emerald-500"
            onClick={() => onPurchase(lot.tokenId)}
          >
            <Eye className="mr-2 h-4 w-4" />
            View Revealed Data
          </Button>
        ) : isRejected ? (
          <Button size="sm" className="w-full" disabled variant="outline">
            <AlertCircle className="mr-2 h-4 w-4 text-red-400" />
            Rejected — Not Available
          </Button>
        ) : (
          <div className="space-y-1.5">
            <Button
              size="sm"
              className="w-full bg-amber-600 hover:bg-amber-500"
              onClick={() => onPurchase(lot.tokenId)}
              disabled={purchasing}
            >
              {purchasing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSending ? "Sign in Wallet..." : isConfirming ? "Confirming TX..." : "Processing..."}
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Purchase NFT ({PURCHASE_PRICE} USDr)
                </>
              )}
            </Button>
            {!purchasing && (
              <p className="text-[10px] text-center text-muted-foreground/50">
                Requires Rayls Public Chain · Real on-chain transaction
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RevealedView({
  data,
  tokenId,
  onBack,
}: {
  data: RevealedData;
  tokenId: number;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Marketplace
        </Button>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Unlock className="h-5 w-5 text-emerald-400" />
            Lot #{tokenId} — Private Data Revealed
          </h2>
          <p className="text-sm text-muted-foreground">
            Confidential NFT data unlocked after purchase
          </p>
        </div>
      </div>

      {/* Purchase Transaction */}
      {data.purchaseTxHash && (
        <Card className="border-amber-500/30 bg-card/50">
          <CardContent className="p-4 space-y-2">
            <h3 className="text-sm font-medium text-amber-400 uppercase tracking-wider flex items-center gap-2">
              💰 Purchase Transaction
              <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">Paid {PURCHASE_PRICE} USDr</Badge>
            </h3>
            <p className="text-xs">
              TX:{" "}
              <a
                href={String(data.purchaseExplorer || `https://testnet-explorer.rayls.com/tx/${data.purchaseTxHash}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 underline hover:text-amber-300 font-mono"
              >
                {String(data.purchaseTxHash).slice(0, 14)}...{String(data.purchaseTxHash).slice(-8)}
                <ExternalLink className="inline h-3 w-3 ml-1" />
              </a>
            </p>
            <p className="text-[10px] text-muted-foreground">Verified on Rayls Public Chain (7295799)</p>
          </CardContent>
        </Card>
      )}

      {/* NFT Transaction Links */}
      {(data.mintTxHash || data.bridgeTxHash) && (
        <Card className="border-purple-500/30 bg-card/50">
          <CardContent className="p-4 space-y-2">
            <h3 className="text-sm font-medium text-purple-400 uppercase tracking-wider flex items-center gap-2">
              🎨 NFT Transactions
            </h3>
            <div className="space-y-1 text-xs">
              {data.mintTxHash && (
                <p>
                  Mint (Privacy Node):{" "}
                  <a
                    href={data.mintExplorer || `https://blockscout-privacy-node-0.rayls.com/tx/${data.mintTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 underline hover:text-purple-300"
                  >
                    {String(data.mintTxHash).slice(0, 14)}...{String(data.mintTxHash).slice(-8)}
                    <ExternalLink className="inline h-3 w-3 ml-1" />
                  </a>
                </p>
              )}
              {data.bridgeTxHash && (
                <p>
                  Bridge (Privacy → Public):{" "}
                  <a
                    href={data.bridgeExplorer || `https://blockscout-privacy-node-0.rayls.com/tx/${data.bridgeTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 underline hover:text-purple-300"
                  >
                    {String(data.bridgeTxHash).slice(0, 14)}...{String(data.bridgeTxHash).slice(-8)}
                    <ExternalLink className="inline h-3 w-3 ml-1" />
                  </a>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Farm Location */}
        <Card className="border-emerald-500/30 bg-card/50">
          <CardContent className="p-4 space-y-2">
            <h3 className="text-sm font-medium text-emerald-400 uppercase tracking-wider">
              📍 Farm Location
            </h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p><span className="text-foreground font-medium">Region:</span> {String(data.region || "N/A")}</p>
              <p><span className="text-foreground font-medium">Cooperative:</span> {String(data.cooperativeName || "N/A")}</p>
              {data.gps && (
                <p><span className="text-foreground font-medium">GPS:</span>{" "}
                  {data.gps.lat && data.gps.lon
                    ? `${data.gps.lat}, ${data.gps.lon}`
                    : String(data.gps.area || "N/A")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Price & Quality */}
        <Card className="border-amber-500/30 bg-card/50">
          <CardContent className="p-4 space-y-2">
            <h3 className="text-sm font-medium text-amber-400 uppercase tracking-wider">
              💰 Price & Quality
            </h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p><span className="text-foreground font-medium">Price/kg:</span> {String(data.purchasePricePerKg || "N/A")}</p>
              {data.avgTemperature && (
                <p><span className="text-foreground font-medium">Avg Temp:</span> {data.avgTemperature}°C</p>
              )}
              {data.avgHumidity && (
                <p><span className="text-foreground font-medium">Avg Humidity:</span> {data.avgHumidity}%</p>
              )}
              {data.avgSoilPH && (
                <p><span className="text-foreground font-medium">Soil pH:</span> {data.avgSoilPH}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Flavor Profile */}
        {data.flavorProfile && typeof data.flavorProfile === "object" && (
          <Card className="border-orange-500/30 bg-card/50">
            <CardContent className="p-4 space-y-2">
              <h3 className="text-sm font-medium text-orange-400 uppercase tracking-wider">
                🍫 Flavor Profile
              </h3>
              <div className="space-y-1.5">
                {Object.entries(data.flavorProfile).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-20 capitalize">{key}</span>
                    <div className="flex-1 h-2 rounded-full bg-black/30 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-orange-400/70"
                        style={{ width: `${(Number(val) / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-foreground w-8 text-right">
                      {Number(val).toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Analysis */}
        <Card className="border-blue-500/30 bg-card/50">
          <CardContent className="p-4 space-y-2">
            <h3 className="text-sm font-medium text-blue-400 uppercase tracking-wider">
              🤖 AI Analysis
            </h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              {data.cropHealthAssessment && (
                <p>{String(data.cropHealthAssessment)}</p>
              )}
              {data.labQualityAnalysis && (
                <p className="mt-2">{String(data.labQualityAnalysis)}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        {data.producerRecommendations && (
          <Card className="border-cyan-500/30 bg-card/50">
            <CardContent className="p-4 space-y-2">
              <h3 className="text-sm font-medium text-cyan-400 uppercase tracking-wider">
                📋 Producer Recommendations
              </h3>
              <p className="text-sm text-muted-foreground">
                {String(data.producerRecommendations)}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Data Integrity */}
        {data.iotDataHash && (
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-4 space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                🔐 Data Integrity
              </h3>
              <p className="text-xs font-mono text-muted-foreground break-all">
                IoT Hash: {String(data.iotDataHash)}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
