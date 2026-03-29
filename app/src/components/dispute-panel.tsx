"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

interface DisputeResult {
  lotId: number;
  disputedDeviceId: number;
  originalGrade: string;
  originalScore: number;
  revisedGrade: string;
  revisedScore: number;
  excludedReadings: number;
  remainingReadings: number;
  crossDeviceValidation: boolean;
  resolution: "revised" | "upheld" | "insufficient_data";
  explanation: string;
}

interface DisputePanelProps {
  lotId: string | number | null;
  analysis: Record<string, unknown> | null;
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case "S": return "text-yellow-400";
    case "A": return "text-emerald-400";
    case "B": return "text-blue-400";
    case "C": return "text-orange-400";
    case "D": return "text-red-400";
    default: return "text-muted-foreground";
  }
}

function getResolutionBadge(resolution: string) {
  switch (resolution) {
    case "revised":
      return (
        <Badge className="bg-emerald-500/10 text-emerald-400">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Revised — Score Updated
        </Badge>
      );
    case "upheld":
      return (
        <Badge className="bg-amber-500/10 text-amber-400">
          <AlertCircle className="mr-1 h-3 w-3" />
          Upheld — Original Score Stands
        </Badge>
      );
    case "insufficient_data":
      return (
        <Badge className="bg-red-500/10 text-red-400">
          <AlertCircle className="mr-1 h-3 w-3" />
          Insufficient Data
        </Badge>
      );
    default:
      return null;
  }
}

export function DisputePanel({ lotId, analysis }: DisputePanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DisputeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Extract unique device IDs from analysis
  const deviceIds: number[] = [];
  if (analysis) {
    const priv = analysis.privateMetadata as Record<string, unknown> | undefined;
    const deviceStats = priv?.deviceStats as Array<{ deviceId: number }> | undefined;
    if (deviceStats) {
      for (const stat of deviceStats) {
        deviceIds.push(stat.deviceId);
      }
    }
  }

  const handleSubmit = useCallback(async () => {
    if (!lotId || !selectedDevice || !reason.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/dispute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lotId: Number(lotId),
          deviceId: Number(selectedDevice),
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Request failed with status ${res.status}`);
      }

      setResult(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [lotId, selectedDevice, reason]);

  if (!lotId || !analysis) return null;

  return (
    <div className="space-y-4">
      <Card className="border-amber-500/30 bg-card/50">
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-400" />
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Dispute IoT Data
              </h3>
            </div>
            {!showForm && !result && (
              <Button
                onClick={() => setShowForm(true)}
                variant="outline"
                size="lg"
                className="h-11 w-full sm:w-auto border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              >
                <ShieldAlert className="mr-2 h-4 w-4" />
                Dispute IoT Data
              </Button>
            )}
          </div>

          {!showForm && !result && (
            <p className="text-sm text-muted-foreground">
              If an IoT sensor malfunctioned, you can dispute its readings.
              The system will cross-reference data from other devices and
              re-analyze your lot excluding the faulty sensor.
            </p>
          )}

          {showForm && !result && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Device ID
                </label>
                <select
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="h-11 w-full rounded-lg border border-border/50 bg-card/50 px-3 text-sm text-foreground"
                >
                  <option value="">Select a device...</option>
                  {deviceIds.map((id) => (
                    <option key={id} value={id}>
                      Device #{id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Reason for Dispute
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this device's readings should be disputed (e.g., sensor was replaced, device malfunction observed)..."
                  rows={3}
                  className="w-full rounded-lg border border-border/50 bg-card/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedDevice || !reason.trim() || loading}
                  size="lg"
                  className="h-11 bg-amber-600 text-white hover:bg-amber-500"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Dispute...
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="mr-2 h-4 w-4" />
                      Submit Dispute
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowForm(false);
                    setError(null);
                  }}
                  variant="outline"
                  size="lg"
                  className="h-11"
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>

              {error && (
                <Badge className="bg-red-500/10 text-red-400">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  {error}
                </Badge>
              )}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {getResolutionBadge(result.resolution)}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Original Score */}
                <div className="rounded-lg bg-black/20 p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Original</div>
                  <div className={`text-2xl font-bold ${getGradeColor(result.originalGrade)}`}>
                    {result.originalGrade}
                  </div>
                  <div className="text-lg font-semibold text-foreground">
                    {result.originalScore}/100
                  </div>
                </div>

                {/* Arrow */}
                <div className="hidden sm:flex items-center justify-center">
                  <ArrowRight className="h-8 w-8 text-muted-foreground/30" />
                </div>

                {/* Revised Score */}
                <div className="rounded-lg bg-black/20 p-3 text-center border border-emerald-500/20">
                  <div className="text-xs text-muted-foreground mb-1">Revised</div>
                  <div className={`text-2xl font-bold ${getGradeColor(result.revisedGrade)}`}>
                    {result.revisedGrade}
                  </div>
                  <div className="text-lg font-semibold text-foreground">
                    {result.revisedScore}/100
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 text-[10px]">
                  Disputed Device: #{result.disputedDeviceId}
                </Badge>
                <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 text-[10px]">
                  Excluded: {result.excludedReadings} readings
                </Badge>
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 text-[10px]">
                  Remaining: {result.remainingReadings} readings
                </Badge>
                <Badge
                  variant="secondary"
                  className={`text-[10px] ${
                    result.crossDeviceValidation
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-amber-500/10 text-amber-400"
                  }`}
                >
                  Cross-Device: {result.crossDeviceValidation ? "Anomaly Detected" : "Consistent"}
                </Badge>
              </div>

              <div className="rounded-lg bg-black/20 p-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Explanation</p>
                <p>{result.explanation}</p>
              </div>

              <Button
                onClick={() => {
                  setResult(null);
                  setShowForm(false);
                  setSelectedDevice("");
                  setReason("");
                  setError(null);
                }}
                variant="outline"
                size="sm"
                className="border-border/50"
              >
                File Another Dispute
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
