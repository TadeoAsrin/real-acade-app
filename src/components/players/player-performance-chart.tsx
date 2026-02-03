
"use client";

import * as React from 'react';
import dynamic from 'next/dynamic';
import type { PlayerStats } from "@/lib/definitions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

// Importación dinámica de Recharts para evitar errores en el build de producción (SSR)
const LineChart = dynamic(() => import('recharts').then((mod) => mod.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then((mod) => mod.Line), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((mod) => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then((mod) => mod.CartesianGrid), { ssr: false });

const ChartContainer = dynamic(() => import('../ui/chart').then((mod) => mod.ChartContainer), { ssr: false });
const ChartTooltip = dynamic(() => import('../ui/chart').then((mod) => mod.ChartTooltip), { ssr: false });
const ChartTooltipContent = dynamic(() => import('../ui/chart').then((mod) => mod.ChartTooltipContent), { ssr: false });
const ChartLegend = dynamic(() => import('../ui/chart').then((mod) => mod.ChartLegend), { ssr: false });
const ChartLegendContent = dynamic(() => import('../ui/chart').then((mod) => mod.ChartLegendContent), { ssr: false });

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rendimiento por Partido</CardTitle>
        <CardDescription>Goles en los últimos partidos.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80 w-full">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <ChartTooltip
              content={<ChartTooltipContent indicator="dot" />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              type="monotone"
              dataKey="Goles"
              stroke="var(--color-Goles)"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
