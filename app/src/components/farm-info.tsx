"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Mountain, TreePalm } from "lucide-react";

const stats = [
  {
    icon: TreePalm,
    label: "Farm",
    value: "Finca El Llano",
    sub: "Fine Cacao Producer",
  },
  {
    icon: MapPin,
    label: "Origin",
    value: "Arauca, Colombia",
    sub: "Single-origin estate",
  },
  {
    icon: Mountain,
    label: "Regions",
    value: "4 Active",
    sub: "Arauca · Casanare · Meta · Vichada",
  },
];

export function FarmInfo() {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Farm Overview
        </h2>
        <Badge
          variant="secondary"
          className="bg-emerald-500/10 text-emerald-400 text-[10px] uppercase tracking-wide"
        >
          Verified
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="border-border/50 bg-card/50 transition-smooth hover:border-emerald-500/30 hover:bg-card/80"
          >
            <CardContent className="flex items-start gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                <stat.icon className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-0.5 text-base font-semibold leading-tight">
                  {stat.value}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {stat.sub}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
