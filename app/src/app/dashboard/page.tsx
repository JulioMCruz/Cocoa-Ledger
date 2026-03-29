"use client";

import { useState, useCallback } from "react";
import Papa from "papaparse";
import { AuthGuard } from "@/components/auth-guard";
import { Header } from "@/components/header";
import { FarmInfo } from "@/components/farm-info";
import { IoTTable } from "@/components/iot-table";
import { StoragePanel } from "@/components/storage-panel";
import { SkeletonTable } from "@/components/skeleton-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  FileSpreadsheet,
  Loader2,
  Wifi,
  Activity,
  Radio,
} from "lucide-react";
import type { IoTReading } from "@/lib/types";

function generateJobId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `JOB-${ts}-${rand}`.toUpperCase();
}

function DashboardContent() {
  const [data, setData] = useState<IoTReading[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobTimestamp, setJobTimestamp] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<string>("iot-data-test.csv");
  const [storedMap, setStoredMap] = useState<Map<number, string>>(new Map());
  const [currentIndex, setCurrentIndex] = useState<number | undefined>(undefined);

  const loadCSV = useCallback(async () => {
    setLoading(true);
    const newJobId = generateJobId();
    setJobId(newJobId);
    setJobTimestamp(new Date().toLocaleString());
    setStoredMap(new Map());
    setCurrentIndex(undefined);

    console.log("%c🍫 COCOA LEDGER — IoT DATA IMPORT", "color: #22c55e; font-size: 14px; font-weight: bold");
    console.log(`%c📋 Job ID: ${newJobId}`, "color: #a855f7");
    console.log(`%c📁 Loading: ${csvFile}`, "color: #3b82f6");

    try {
      await new Promise((r) => setTimeout(r, 800));
      const res = await fetch(`/${csvFile}`);
      const text = await res.text();
      const result = Papa.parse<IoTReading>(text, {
        header: true,
        skipEmptyLines: true,
      });
      console.log(`%c✅ Loaded ${result.data.length} IoT readings from ${csvFile}`, "color: #22c55e");
      console.log("%c📊 Sample reading:", "color: #6b7280", result.data[0]);
      console.log(`%c🌡️ Fields: ${Object.keys(result.data[0] || {}).join(", ")}`, "color: #6b7280");
      setData(result.data);
      setLoaded(true);
    } catch {
      console.error("Failed to load IoT data");
    } finally {
      setLoading(false);
    }
  }, [csvFile]);

  const handleReadingStored = useCallback((index: number, hash: string) => {
    console.log(`%c⛓️ ON-CHAIN: Reading #${index + 1} stored — https://blockscout-privacy-node-0.rayls.com/tx/${hash}`, "color: #22c55e");
    setCurrentIndex(index + 1);
    setStoredMap((prev) => {
      const next = new Map(prev);
      next.set(index, hash);
      return next;
    });
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 sm:px-6 sm:py-8">
        <div className="space-y-5 sm:space-y-8">
          <section className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-emerald-500/10 text-emerald-400 text-[10px] uppercase tracking-wide"
              >
                <Wifi className="mr-1 h-3 w-3" />
                Live IoT
              </Badge>
              <Badge
                variant="secondary"
                className="bg-blue-500/10 text-blue-400 text-[10px] uppercase tracking-wide"
              >
                <Activity className="mr-1 h-3 w-3" />
                8 Devices
              </Badge>
              {jobId && (
                <Badge
                  variant="secondary"
                  className="bg-purple-500/10 text-purple-400 text-[10px] font-mono uppercase tracking-wide"
                >
                  {jobId}
                </Badge>
              )}
            </div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Farmer Dashboard
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              Read IoT sensor data from your farm devices and store it
              immutably on the Rayls Privacy Node.
            </p>
          </section>

          <FarmInfo />

          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  IoT Sensor Data
                </h2>
                {loaded && (
                  <Badge
                    variant="secondary"
                    className="bg-emerald-500/10 text-emerald-400 text-[10px] tabular-nums uppercase tracking-wide"
                  >
                    {data.length.toLocaleString()} readings
                  </Badge>
                )}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {/* CSV file selector */}
                <select
                  value={csvFile}
                  onChange={(e) => setCsvFile(e.target.value)}
                  className="h-11 rounded-lg border border-border/50 bg-card/50 px-3 text-sm text-foreground"
                >
                  <option value="iot-data-test.csv">Test (10 readings)</option>
                  <option value="iot-data-50.csv">Medium (50 readings)</option>
                  <option value="iot-data-100.csv">Large (100 readings)</option>
                  <option value="iot-data.csv">Full (1,000 readings)</option>
                </select>

                <Button
                  onClick={loadCSV}
                  disabled={loading}
                  variant={loaded ? "outline" : "default"}
                  size="lg"
                  className={`h-11 w-full sm:w-auto ${
                    loaded
                      ? "border-border/50"
                      : "bg-emerald-600 text-white hover:bg-emerald-500"
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scanning Devices…
                    </>
                  ) : loaded ? (
                    <>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Rescan Devices
                    </>
                  ) : (
                    <>
                      <Radio className="mr-2 h-4 w-4" />
                      Read IoT Farm Devices
                    </>
                  )}
                </Button>
              </div>
            </div>

            {jobId && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border/30 bg-card/30 px-3 py-2 text-xs text-muted-foreground">
                <span>
                  <span className="font-medium text-foreground">Job:</span>{" "}
                  <span className="font-mono">{jobId}</span>
                </span>
                <span>
                  <span className="font-medium text-foreground">Started:</span>{" "}
                  {jobTimestamp}
                </span>
                <span>
                  <span className="font-medium text-foreground">File:</span>{" "}
                  {csvFile}
                </span>
                <span>
                  <span className="font-medium text-foreground">Status:</span>{" "}
                  <span
                    className={
                      loaded ? "text-emerald-400" : "text-amber-400"
                    }
                  >
                    {loading
                      ? "Scanning…"
                      : loaded
                        ? "Data loaded"
                        : "Pending"}
                  </span>
                </span>
              </div>
            )}

            {loading ? (
              <SkeletonTable />
            ) : loaded ? (
              <IoTTable data={data} storedMap={storedMap} currentIndex={currentIndex} />
            ) : (
              <Card className="border-border/50 border-dashed bg-card/20">
                <CardContent className="flex flex-col items-center gap-3 py-14 text-center sm:py-16">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/40">
                    <Database className="h-7 w-7 text-muted-foreground/50" />
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">
                      No data loaded yet
                    </p>
                    <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground/60">
                      Select a dataset and click &ldquo;Read IoT Farm Devices&rdquo; to scan your sensors
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </section>

          {loaded && (
            <section>
              <StoragePanel data={data} onReadingStored={handleReadingStored} />
            </section>
          )}
        </div>
      </main>

      <footer className="mt-auto border-t border-border/30 py-4">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="text-center text-xs text-muted-foreground/50">
            Cocoa Ledger · Built on{" "}
            <span className="text-emerald-500/70">Rayls Privacy Node</span> ·
            Hackathon 2026 · <span className="font-mono">v0.5.0</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
