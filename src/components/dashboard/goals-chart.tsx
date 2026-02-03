
"use client";

import * as React from 'react';
import dynamic from 'next/dynamic';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import type { Match } from "@/lib/definitions";

// Importación dinámica de Recharts para evitar errores en el build de producción (SSR)
const BarChart = dynamic(() => import('recharts').then((mod) => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then((mod) => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((mod) => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then((mod) => mod.CartesianGrid), { ssr: false });

const ChartContainer = dynamic(() => import('../ui/chart').then((mod) => mod.ChartContainer), { ssr: false });
const ChartTooltip = dynamic(() => import('../ui/chart').then((mod) => mod.ChartTooltip), { ssr: false });
const ChartTooltipContent = dynamic(() => import('../ui/chart').then((mod) => mod.ChartTooltipContent), { ssr: false });
const ChartLegend = dynamic(() => import('../ui/chart').then((mod) => mod.ChartLegend), { ssr: false });
const ChartLegendContent = dynamic(() => import('../ui/chart').then((mod) => mod.ChartLegendContent), { ssr: false });

const chartConfig = {
  azul: {
    label: "Equipo Azul",
    color: "hsl(var(--primary))",
  },
  rojo: {
    label: "Equipo Rojo",
    color: "hsl(var(--accent))",
  },
};

interface GoalsChartProps {
  matches: Match[];
}

export function GoalsChart({ matches }: GoalsChartProps) {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const chartData = React.useMemo(() => {
    return [...matches]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((match) => ({
        date: new Date(match.date).toLocaleDateString("es-ES", {
          month: "short",
          day: "numeric",
        }),
        azul: match.teamAScore,
        rojo: match.teamBScore,
      }))
      .slice(-10);
  }, [matches]);

  if (!isMounted) {
    return (
      <Card className="h-80 w-full animate-pulse bg-muted/10">
        <CardHeader>
          <CardTitle>Rendimiento General</CardTitle>
          <CardDescription>Cargando estadísticas...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rendimiento General</CardTitle>
        <CardDescription>Goles por equipo en los últimos partidos.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80 w-full">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <ChartTooltip
              cursor={{ fill: "hsl(var(--secondary))" }}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="azul"
              fill="var(--color-azul)"
              stackId="a"
            />
            <Bar
              dataKey="rojo"
              fill="var(--color-rojo)"
              radius={[4, 4, 0, 0]}
              stackId="a"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
