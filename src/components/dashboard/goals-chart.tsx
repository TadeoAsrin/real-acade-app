"use client";

import * as React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';
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
import type { Match } from "@/lib/definitions";
import { BarChart3 } from "lucide-react";

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
    if (!matches || matches.length === 0) return [];
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
      <Card className="h-[400px] w-full animate-pulse bg-muted/10">
        <CardHeader>
          <CardTitle>Rendimiento General</CardTitle>
          <CardDescription>Cargando estadísticas...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="h-[400px] flex flex-col items-center justify-center text-center p-6 border-dashed">
        <BarChart3 className="h-12 w-12 text-muted-foreground/20 mb-4" />
        <CardTitle className="text-muted-foreground">Sin Datos de Partidos</CardTitle>
        <CardDescription>Carga el primer partido para ver el rendimiento.</CardDescription>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xl font-black uppercase tracking-tight italic">Rendimiento General</CardTitle>
        <CardDescription>Goles por equipo en los últimos 10 encuentros.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsla(var(--foreground), 0.05)" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fill: 'hsla(var(--muted-foreground), 0.5)', fontSize: 10, fontWeight: 'bold' }}
              />
              <YAxis 
                allowDecimals={false} 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: 'hsla(var(--muted-foreground), 0.5)', fontSize: 10 }}
              />
              <ChartTooltip
                cursor={{ fill: "hsla(var(--foreground), 0.05)" }}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="azul"
                fill="var(--color-azul)"
                stackId="a"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="rojo"
                fill="var(--color-rojo)"
                radius={[4, 4, 0, 0]}
                stackId="a"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}