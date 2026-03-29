"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import type { IoTReading } from "@/lib/types";

interface IoTTableProps {
  data: IoTReading[];
  storedMap?: Map<number, string>; // index -> tx hash
  currentIndex?: number; // currently being stored
}

const PAGE_SIZE = 20;
const EXPLORER = "https://blockscout-privacy-node-0.rayls.com/tx/";

function formatTemp(raw: string) {
  return (parseInt(raw) / 100).toFixed(1) + "°C";
}
function formatPercent(raw: string) {
  return (parseInt(raw) / 100).toFixed(1) + "%";
}
function formatPH(raw: string) {
  return (parseInt(raw) / 100).toFixed(2);
}
function formatPrecip(raw: string) {
  return (parseInt(raw) / 100).toFixed(1) + "mm";
}
function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  }) + " " + d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function statusColor(status: string) {
  switch (status) {
    case "healthy":
      return "bg-emerald-500/15 text-emerald-400";
    case "flowering":
      return "bg-purple-500/15 text-purple-400";
    case "fruiting":
      return "bg-amber-500/15 text-amber-400";
    case "growing":
      return "bg-blue-500/15 text-blue-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function IoTTable({ data, storedMap, currentIndex }: IoTTableProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(data.length / PAGE_SIZE);

  const pageData = useMemo(
    () => data.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [data, page]
  );

  return (
    <div className="space-y-3">
      <div className="table-scroll overflow-x-auto rounded-xl border border-border/50 bg-card/30">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                #
              </TableHead>
              <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                On-Chain
              </TableHead>
              <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Device
              </TableHead>
              <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Timestamp
              </TableHead>
              <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Type
              </TableHead>
              <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Region
              </TableHead>
              <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Temp
              </TableHead>
              <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Humidity
              </TableHead>
              <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Soil pH
              </TableHead>
              <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Moisture
              </TableHead>
              <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Rain
              </TableHead>
              <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Quality
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.map((row, idx) => {
              const globalIdx = page * PAGE_SIZE + idx;
              const txHash = storedMap?.get(globalIdx);
              const isStoring = currentIndex === globalIdx;
              const isStored = !!txHash;

              return (
                <TableRow
                  key={globalIdx}
                  className={`border-border/30 transition-all ${
                    isStoring
                      ? "bg-amber-500/10 animate-pulse"
                      : isStored
                        ? "bg-emerald-500/5"
                        : "hover:bg-emerald-500/5"
                  }`}
                >
                  <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                    {globalIdx + 1}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {isStoring ? (
                      <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                    ) : isStored ? (
                      <a
                        href={`${EXPLORER}${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="inline-block h-4 w-4 rounded-full border border-border/50" />
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10 font-mono text-xs font-medium text-emerald-400">
                      {row.device_id}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs">
                    {formatTime(row.timestamp)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {row.cacao_type}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {row.region}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs">
                    {formatTemp(row.temperature)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs">
                    {formatPercent(row.humidity)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs">
                    {formatPH(row.soil_ph)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs">
                    {formatPercent(row.soil_moisture)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs">
                    {formatPrecip(row.precipitation)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] uppercase tracking-wide ${statusColor(row.crop_status)}`}
                    >
                      {row.crop_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="font-mono text-xs font-medium">
                      {row.lab_quality_score}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-muted-foreground">
          <span className="hidden sm:inline">Showing </span>
          {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, data.length)}{" "}
          of {data.length.toLocaleString()}
        </p>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-border/50"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[4rem] text-center text-xs tabular-nums text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-border/50"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
