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

export function StoragePanel({ data, onReadingStored }: StoragePanelProps) {
  const { isConnected } = useAccount();
  const logEndRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState<StorageStatus>("idle");
  const [stored, setStored] = useState(0);
  const [lotId, setLotId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const total = data.length;
  const progress = total > 0 ? (stored / total) * 100 : 0;

  const addLog = useCallback((message: string, type: LogEntry["type"] = "info") => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { time, message, type }]);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleStore = useCallback(async () => {
    if (!isConnected || data.length === 0) return;

    setError(null);
    setStored(0);
    setStatus("creating_lot");
    setLotId(null);
    setLogs([]);
    addLog(`Starting batch process for ${data.length} readings...`);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/store-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          readings: data,
          farmName: "Finca Dorada",
          origin: "Peru",
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        setError("Failed to start batch process");
        setStatus("error");
        addLog("Failed to start batch process", "error");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === "lot_created") {
              setLotId(event.lotId);
              setStatus("storing");
              addLog(`Lot #${event.lotId} created — TX: ${event.hash}`, "success");
            } else if (event.type === "reading_stored") {
              setStored(event.index + 1);
              onReadingStored?.(event.index, event.hash);
              if ((event.index + 1) % 10 === 0 || event.index === 0 || event.index === total - 1) {
                addLog(`Reading ${event.index + 1}/${total} stored — TX: ${event.hash}`);
              }
            } else if (event.type === "reading_error") {
              addLog(`Reading ${event.index} failed: ${event.error}`, "error");
            } else if (event.type === "complete") {
              setStored(total);
              setStatus("finalizing");
              addLog(`All readings stored. Finalizing lot...`);
              addLog(`Lot finalized — TX: ${event.finalizeHash}`, "success");
              setTimeout(() => setStatus("done"), 500);
            } else if (event.type === "error") {
              setError(event.message);
              setStatus("error");
              addLog(`Error: ${event.message}`, "error");
            } else if (event.type === "status") {
              addLog(event.message);
              if (event.message === "Finalizing lot...") {
                setStatus("finalizing");
              }
            }
          } catch {
            // skip parse errors
          }
        }
      }
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setStatus("idle");
        addLog("Process cancelled by user", "error");
      } else {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        setStatus("error");
        addLog(`Error: ${msg}`, "error");
      }
    }
  }, [isConnected, data, total, addLog, onReadingStored]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    setStatus("idle");
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
            <div className="max-h-64 overflow-y-auto rounded-lg bg-black/40 p-3 font-mono text-xs leading-relaxed">
              {logs.map((log, i) => (
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
                    {log.message}
                  </span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
