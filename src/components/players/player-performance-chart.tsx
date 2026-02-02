"use client";

import type { PlayerStats } from "@/lib/definitions";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
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
import type { ChartConfig } from "../ui/chart";

type PerformanceChartProps = {
  matchHistory: (PlayerStats & { matchId: string; date: string })[];
};

const chartConfig = {
  Goles: {
    label: "Goles",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;


export function PlayerPerformanceChart({ matchHistory }: PerformanceChartProps) {
  const chartData = matchHistory
    .map((match) => ({
      date: new Date(match.date).toLocaleDateString("es-ES", {
        month: "short",
        day: "numeric",
      }),
      Goles: match.goals,
    }))
    .reverse();

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
