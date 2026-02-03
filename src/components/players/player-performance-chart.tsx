"use client";

import * as React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';
import type { PlayerStats } from "@/lib/definitions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "../ui/chart";
import { TrendingUp } from "lucide-react";

type PerformanceChartProps = {
  matchHistory: (PlayerStats & { matchId: string; date: string })[];
};

const chartConfig = {
  Goles: {
    label: "Goles",
    color: "hsl(var(--primary))",
  },
};

export function PlayerPerformanceChart({ matchHistory }: PerformanceChartProps) {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const chartData = React.useMemo(() => {
    if (!matchHistory || matchHistory.length === 0) return [];
    return matchHistory
      .map((match) => ({
        date: new Date(match.date).toLocaleDateString("es-ES", {
          month: "short",
          day: "numeric",
        }),
        Goles: match.goals,
      }))
      .reverse();
  }, [matchHistory]);

  if (!isMounted) {
    return (
      <Card className="h-80 w-full animate-pulse bg-muted/10">
        <CardHeader>
          <CardTitle>Rendimiento por Partido</CardTitle>
          <CardDescription>Cargando gráfico...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="h-80 flex flex-col items-center justify-center text-center p-6 border-dashed opacity-50">
        <TrendingUp className="h-10 w-10 mb-2 text-muted-foreground" />
        <CardTitle className="text-sm">Sin historial</CardTitle>
        <CardDescription className="text-xs">Participa en partidos para ver tu evolución.</CardDescription>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-black uppercase italic tracking-tight">Evolución de Goles</CardTitle>
        <CardDescription>Goles marcados en los últimos encuentros.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsla(var(--foreground), 0.05)" />
              <XAxis 
                dataKey="date" 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: 'hsla(var(--muted-foreground), 0.5)', fontSize: 10 }}
              />
              <YAxis 
                allowDecimals={false} 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: 'hsla(var(--muted-foreground), 0.5)', fontSize: 10 }}
              />
              <ChartTooltip
                content={<ChartTooltipContent indicator="dot" />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="Goles"
                stroke="var(--color-Goles)"
                strokeWidth={3}
                dot={{ r: 4, fill: "var(--color-Goles)", strokeWidth: 2, stroke: "hsl(var(--background))" }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}