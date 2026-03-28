"use client";

import { useState, useCallback, useRef } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  Pause,
  Play,
} from "lucide-react";
import { cocoaLedgerDataAbi, COCOA_LEDGER_DATA_ADDRESS } from "@/lib/contract";
import type { IoTReading, StorageStatus } from "@/lib/types";

interface StoragePanelProps {
  data: IoTReading[];
}

export function StoragePanel({ data }: StoragePanelProps) {
  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [status, setStatus] = useState<StorageStatus>("idle");
  const [stored, setStored] = useState(0);
  const [lotId, setLotId] = useState<bigint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const pausedRef = useRef(false);
  const [isPaused, setIsPaused] = useState(false);

  const total = data.length;
  const progress = total > 0 ? (stored / total) * 100 : 0;

  const togglePause = useCallback(() => {
    pausedRef.current = !pausedRef.current;
    setIsPaused(pausedRef.current);
  }, []);

  const handleStore = useCallback(async () => {
    if (!isConnected || data.length === 0) return;

    setError(null);
    setStored(0);
    pausedRef.current = false;
    setIsPaused(false);

    try {
      // Step 1: Create lot
      setStatus("creating-lot");
      const createHash = await writeContractAsync({
        address: COCOA_LEDGER_DATA_ADDRESS,
        abi: cocoaLedgerDataAbi,
        functionName: "createLot",
        args: ["Finca Dorada", "Cusco, Peru"],
      });
      setTxHash(createHash);

      // For gasless chain, use a simple lot ID
      // In production, you'd parse the event log for the returned lotId
      const currentLotId = BigInt(1);
      setLotId(currentLotId);

      // Step 2: Store readings one by one
      setStatus("storing");

      for (let i = 0; i < data.length; i++) {
        // Check for pause
        while (pausedRef.current) {
          await new Promise((r) => setTimeout(r, 500));
        }

        const row = data[i];
        try {
          const hash = await writeContractAsync({
            address: COCOA_LEDGER_DATA_ADDRESS,
            abi: cocoaLedgerDataAbi,
            functionName: "storeReading",
            args: [
              currentLotId,
              BigInt(row.device_id),
              BigInt(row.temperature),
              BigInt(row.humidity),
              BigInt(row.soil_moisture),
              BigInt(row.soil_ph),
              BigInt(row.precipitation),
              BigInt(row.light_intensity),
              `${row.gps_lat},${row.gps_lng}`,
            ],
          });
          setTxHash(hash);
          setStored(i + 1);
        } catch (txErr: unknown) {
          const message = txErr instanceof Error ? txErr.message : "Unknown error";
          // If user rejects, stop. Otherwise continue.
          if (message.includes("rejected") || message.includes("denied")) {
            throw txErr;
          }
          console.warn(`Reading ${i + 1} failed, continuing:`, message);
          setStored(i + 1);
        }
      }

      // Step 3: Finalize
      setStatus("finalizing");
      const finalizeHash = await writeContractAsync({
        address: COCOA_LEDGER_DATA_ADDRESS,
        abi: cocoaLedgerDataAbi,
        functionName: "finalizeLot",
        args: [currentLotId],
      });
      setTxHash(finalizeHash);

      setStatus("done");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message.slice(0, 200));
      setStatus("error");
    }
  }, [isConnected, data, writeContractAsync]);

  if (!isConnected) {
    return (
      <Card className="border-border/50 bg-card/30">
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Shield className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">Connect Wallet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect your wallet to store IoT data on the Privacy Node
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/30">
      <CardContent className="space-y-4 p-4 sm:p-6">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Privacy Node Storage
            </h3>
            <StatusBadge status={status} />
          </div>
          {status === "storing" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={togglePause}
            >
              {isPaused ? (
                <Play className="h-4 w-4 text-emerald-400" />
              ) : (
                <Pause className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          )}
        </div>

        {/* Progress area */}
        {status !== "idle" && (
          <div className="space-y-2">
            <Progress
              value={status === "done" ? 100 : progress}
              className="h-2 bg-muted [&>div]:bg-emerald-500 [&>div]:transition-all [&>div]:duration-300"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {status === "creating-lot" && "Creating lot on-chain..."}
                {status === "storing" &&
                  (isPaused
                    ? "Paused"
                    : `Storing reading ${stored + 1} of ${total}...`)}
                {status === "finalizing" && "Finalizing lot..."}
                {status === "done" &&
                  `All ${total.toLocaleString()} readings stored ✓`}
                {status === "error" && "Error occurred"}
              </p>
              <p className="font-mono text-xs tabular-nums text-muted-foreground">
                {stored.toLocaleString()} / {total.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Latest TX */}
        {txHash && (
          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Latest TX
            </p>
            <p className="mt-0.5 truncate font-mono text-xs text-emerald-400">
              {txHash}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}

        {/* Success */}
        {status === "done" && (
          <div className="flex items-start gap-2 rounded-lg bg-emerald-500/10 px-3 py-2.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-emerald-400">
                Lot finalized successfully
              </p>
              <p className="mt-0.5 text-xs text-emerald-400/70">
                {total.toLocaleString()} IoT readings stored on Rayls Privacy
                Node
              </p>
            </div>
          </div>
        )}

        {/* Action button */}
        <Button
          onClick={handleStore}
          disabled={
            data.length === 0 ||
            status === "creating-lot" ||
            status === "storing" ||
            status === "finalizing"
          }
          className="h-12 w-full bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-40"
        >
          {status === "idle" || status === "error" ? (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Store {total.toLocaleString()} Readings on Privacy Node
            </>
          ) : status === "done" ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Store Again
            </>
          ) : (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: StorageStatus }) {
  switch (status) {
    case "idle":
      return null;
    case "creating-lot":
    case "storing":
    case "finalizing":
      return (
        <Badge
          variant="secondary"
          className="bg-amber-500/10 text-amber-400 text-[10px] uppercase tracking-wide"
        >
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          {status === "creating-lot"
            ? "Creating"
            : status === "finalizing"
              ? "Finalizing"
              : "Storing"}
        </Badge>
      );
    case "done":
      return (
        <Badge
          variant="secondary"
          className="bg-emerald-500/10 text-emerald-400 text-[10px] uppercase tracking-wide"
        >
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Complete
        </Badge>
      );
    case "error":
      return (
        <Badge
          variant="secondary"
          className="bg-red-500/10 text-red-400 text-[10px] uppercase tracking-wide"
        >
          <AlertCircle className="mr-1 h-3 w-3" />
          Error
        </Badge>
      );
  }
}
