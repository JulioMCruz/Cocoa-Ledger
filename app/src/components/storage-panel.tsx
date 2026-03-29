"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useAccount } from "wagmi";
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
  Terminal,
} from "lucide-react";
import type { IoTReading, StorageStatus } from "@/lib/types";

interface StoragePanelProps {
  data: IoTReading[];
  onReadingStored?: (index: number, hash: string) => void;
}

interface LogEntry {
  time: string;
  message: string;
  type: "info" | "success" | "error";
}

const CHUNK_SIZE = 5;

export function StoragePanel({ data, onReadingStored }: StoragePanelProps) {
  const { isConnected } = useAccount();
  const logEndRef = useRef<HTMLDivElement>(null);
  const agentLogEndRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState<StorageStatus>("idle");
  const [stored, setStored] = useState(0);
  const [lotId, setLotId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [agentLogs, setAgentLogs] = useState<LogEntry[]>([]);
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null);
  const cancelRef = useRef(false);

  const total = data.length;
  const progress = total > 0 ? (stored / total) * 100 : 0;

  const addLog = useCallback((message: string, type: LogEntry["type"] = "info") => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { time, message, type }]);
  }, []);

  const addAgentLog = useCallback((message: string, type: LogEntry["type"] = "info") => {
    const time = new Date().toLocaleTimeString();
    setAgentLogs((prev) => [...prev, { time, message, type }]);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    agentLogEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentLogs]);

  const handleStore = useCallback(async () => {
    if (!isConnected || data.length === 0) return;

    console.log("%c🍫 COCOA LEDGER — BATCH STORE STARTED", "color: #22c55e; font-size: 14px; font-weight: bold");
    console.log(`%c📦 Total readings to store: ${data.length} (chunks of ${CHUNK_SIZE})`, "color: #3b82f6");
    console.log("%c🔗 Target: Rayls Privacy Node (Chain 800000, gasless)", "color: #3b82f6");

    setError(null);
    setStored(0);
    setStatus("creating_lot");
    setLotId(null);
    setLogs([]);
    setAgentLogs([]);
    setAnalysis(null);
    cancelRef.current = false;
    addLog(`Starting batch process for ${data.length} readings (chunks of ${CHUNK_SIZE})...`);

    try {
      // Step 1: Create lot
      addLog("Creating lot...");
      const createRes = await fetch("/api/store-chunk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_lot", farmName: "Finca Dorada", origin: "Peru" }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error);

      const currentLotId = createData.lotId;
      setLotId(currentLotId);
      setStatus("storing");
      console.log(`%c✅ LOT CREATED — ID: ${currentLotId}, TX: ${createData.hash}`, "color: #22c55e");
      addLog(`Lot #${currentLotId} created — TX: ${createData.hash}`, "success");

      // Step 2: Store readings in chunks
      let totalStored = 0;
      for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        if (cancelRef.current) {
          addLog("Process cancelled by user", "error");
          setStatus("idle");
          return;
        }

        const chunk = data.slice(i, i + CHUNK_SIZE).map((r, idx) => ({ ...r, _index: i + idx }));
        const chunkRes = await fetch("/api/store-chunk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "store_readings", readings: chunk, lotId: currentLotId }),
        });
        const chunkData = await chunkRes.json();
        if (!chunkRes.ok) throw new Error(chunkData.error);

        for (const result of chunkData.results) {
          totalStored++;
          const pct = Math.round((totalStored / data.length) * 100);
          console.log(`%c📝 Reading ${totalStored}/${data.length} (${pct}%) — TX: ${result.hash}`, "color: #60a5fa");
          console.log(`%c⛓️ ON-CHAIN: https://blockscout-privacy-node-0.rayls.com/tx/${result.hash}`, "color: #22c55e");
          addLog(`Reading ${totalStored}/${data.length} stored — TX: ${result.hash}`, "success");
          onReadingStored?.(result.index, result.hash);
          setStored(totalStored);
        }
      }

      // Step 3: Finalize
      addLog("Finalizing lot...");
      setStatus("finalizing");
      const finalRes = await fetch("/api/store-chunk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "finalize", lotId: currentLotId }),
      });
      const finalData = await finalRes.json();
      if (!finalRes.ok) throw new Error(finalData.error);
      console.log(`%c✅ LOT FINALIZED — TX: ${finalData.hash}`, "color: #22c55e; font-weight: bold");
      addLog(`Lot finalized — TX: ${finalData.hash}`, "success");

      // Step 4: Call agent
      console.log(`%c🤖 Calling Cocoa Agent for lot ${currentLotId}...`, "color: #3b82f6; font-weight: bold");
      addAgentLog("Connecting to Cocoa Agent...");
      addAgentLog(`POST /api/analyze-lot — lot ID ${currentLotId}`);
      addAgentLog("Agent reading IoT transactions from Privacy Node...");

      try {
        const agentRes = await fetch("/api/analyze-lot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lotId: Number(currentLotId) }),
        });
        if (agentRes.ok) {
          const agentData = await agentRes.json();
          const pub = agentData?.publicMetadata;
          const priv = agentData?.privateMetadata;
          console.log("%c🎯 AI ANALYSIS COMPLETE", "color: #22c55e; font-size: 14px; font-weight: bold");
          console.log("%c📊 Public Metadata:", "color: #a855f7; font-weight: bold", pub);
          console.log("%c🔒 Private Metadata:", "color: #f59e0b; font-weight: bold", priv);
          addAgentLog(`AI analysis complete — Grade: ${pub?.qualityGrade}, Score: ${pub?.qualityScore}/100`, "success");
          addAgentLog(`Avg temp: ${pub?.avgTemperature}C, humidity: ${pub?.avgHumidity}%, soil pH: ${pub?.avgSoilPH}`, "info");
          addAgentLog(`Price estimate: $${priv?.priceEstimatePerKg}/kg`, "success");
          addAgentLog(`IoT data hash: ${priv?.iotDataHash}`, "info");
          addAgentLog(`Recommended use: ${pub?.recommendedUse}`, "success");
          addAgentLog("Metadata ready for NFT minting", "success");
          setAnalysis(agentData);
          addLog(`AI Analysis: Grade ${pub?.qualityGrade}, Score ${pub?.qualityScore}/100`, "success");
        } else {
          const errData = await agentRes.json();
          console.log(`%c❌ Agent error: ${errData.error}`, "color: #ef4444");
          addAgentLog(`Agent error: ${errData.error || agentRes.status}`, "error");
        }
      } catch (agentErr: unknown) {
        const msg = agentErr instanceof Error ? agentErr.message : String(agentErr);
        console.log(`%c❌ Agent connection failed: ${msg}`, "color: #ef4444");
        addAgentLog(`Connection failed: ${msg}`, "error");
      }

      setStatus("done");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`%c❌ Error: ${msg}`, "color: #ef4444");
      setError(msg);
      setStatus("error");
      addLog(`Error: ${msg}`, "error");
    }
  }, [isConnected, data, addLog, addAgentLog, onReadingStored]);

  const handleCancel = useCallback(() => {
    cancelRef.current = true;
  }, []);

  const isRunning = status === "creating_lot" || status === "storing" || status === "finalizing";

  return (
    <div className="space-y-4">
      <Card className="border-border/50 bg-card/50">
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-400" />
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Store on Privacy Node
              </h3>
            </div>
            <div className="flex gap-2">
              {isRunning && (
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  size="lg"
                  className="h-11 w-full sm:w-auto border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleStore}
                disabled={!isConnected || data.length === 0 || isRunning}
                size="lg"
                className="h-11 w-full sm:w-auto bg-emerald-600 text-white hover:bg-emerald-500"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {status === "creating_lot"
                      ? "Creating Lot..."
                      : status === "finalizing"
                        ? "Finalizing..."
                        : `Storing ${stored}/${total}...`}
                  </>
                ) : status === "done" ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Stored Successfully
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Store on Privacy Node
                  </>
                )}
              </Button>
            </div>
          </div>

          {(isRunning || status === "done") && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>
                  <span className="font-medium text-foreground">{stored.toLocaleString()}</span> / {total.toLocaleString()} readings
                </span>
                {lotId && (
                  <span>
                    Lot ID: <span className="font-mono text-foreground">{lotId}</span>
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {status === "done" && (
              <Badge className="bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                All {total} readings stored on-chain
              </Badge>
            )}
            {error && (
              <Badge className="bg-red-500/10 text-red-400">
                <AlertCircle className="mr-1 h-3 w-3" />
                {error.slice(0, 80)}
              </Badge>
            )}
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 text-[10px]">
              No gas fees — Privacy Node is gasless
            </Badge>
            <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 text-[10px]">
              Auto-signed — no wallet popups
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Process Log */}
      {logs.length > 0 && (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-3">
              <Terminal className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Process Log
              </h3>
              <Badge variant="secondary" className="text-[10px] bg-muted/30">
                {logs.length} entries
              </Badge>
            </div>
            <div className="max-h-96 overflow-y-auto rounded-lg bg-black/40 p-3 font-mono text-xs leading-relaxed">
              {logs.map((log, i) => {
                const txMatch = log.message.match(/TX: (0x[a-fA-F0-9]+)/);
                const beforeTx = txMatch ? log.message.slice(0, txMatch.index) : log.message;
                const txHash = txMatch ? txMatch[1] : null;
                const afterTx = txMatch ? log.message.slice((txMatch.index || 0) + txMatch[0].length) : "";

                return (
                  <div key={i} className="flex gap-2">
                    <span className="text-muted-foreground/50 shrink-0">[{log.time}]</span>
                    <span
                      className={
                        log.type === "success"
                          ? "text-emerald-400"
                          : log.type === "error"
                            ? "text-red-400"
                            : "text-muted-foreground"
                      }
                    >
                      {beforeTx}
                      {txHash && (
                        <>
                          TX:{" "}
                          <a
                            href={`https://blockscout-privacy-node-0.rayls.com/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-emerald-300 transition-colors"
                          >
                            {txHash.slice(0, 10)}...{txHash.slice(-8)}
                          </a>
                        </>
                      )}
                      {afterTx}
                    </span>
                  </div>
                );
              })}
              <div ref={logEndRef} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agent Interaction Log */}
      {agentLogs.length > 0 && (
        <Card className="border-blue-500/30 bg-card/50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🤖</span>
              <h3 className="text-sm font-medium uppercase tracking-wider text-blue-400">
                Cocoa Agent Interaction
              </h3>
              <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-400">
                {agentLogs.length} steps
              </Badge>
            </div>
            <div className="max-h-80 overflow-y-auto rounded-lg bg-black/40 p-3 font-mono text-xs leading-relaxed">
              {agentLogs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-muted-foreground/50 shrink-0">[{log.time}]</span>
                  <span className="text-blue-400/60 shrink-0">🍫</span>
                  <span
                    className={
                      log.type === "success"
                        ? "text-emerald-400"
                        : log.type === "error"
                          ? "text-red-400"
                          : "text-blue-300/80"
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))}
              <div ref={agentLogEndRef} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Analysis Results */}
      {analysis && (() => {
        const pub = (analysis as Record<string, unknown>).publicMetadata as Record<string, unknown> | undefined;
        const priv = (analysis as Record<string, unknown>).privateMetadata as Record<string, unknown> | undefined;
        return (
          <Card className="border-emerald-500/30 bg-card/50">
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-medium uppercase tracking-wider text-emerald-400">
                  AI Quality Analysis
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg bg-black/20 p-3 text-center">
                  <div className="text-3xl font-bold text-emerald-400">
                    {String(pub?.qualityGrade ?? "-")}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Quality Grade</div>
                </div>
                <div className="rounded-lg bg-black/20 p-3 text-center">
                  <div className="text-3xl font-bold text-foreground">
                    {String(pub?.qualityScore ?? "-")}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Score /100</div>
                </div>
                <div className="rounded-lg bg-black/20 p-3 text-center">
                  <div className="text-3xl font-bold text-foreground">
                    ${String(priv?.priceEstimatePerKg ?? "-")}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Price/kg</div>
                </div>
                <div className="rounded-lg bg-black/20 p-3 text-center">
                  <div className="text-3xl font-bold text-foreground">
                    {String((analysis as Record<string, unknown>).readingsCount ?? "-")}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Readings</div>
                </div>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><span className="font-medium text-foreground">Recommended Use:</span> {String(pub?.recommendedUse ?? "")}</p>
                <p><span className="font-medium text-foreground">Crop Health:</span> {String(pub?.cropHealthAssessment ?? "")}</p>
              </div>
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}
