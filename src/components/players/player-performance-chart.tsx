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
  Asistencias: {
    label: "Asistencias",
    color: "hsl(var(--accent))",
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
      Asistencias: match.assists,
    }))
    .reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rendimiento por Partido</CardTitle>
        <CardDescription>Goles y asistencias en los últimos partidos.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ChartContainer config={chartConfig}>
            <LineChart accessibilityLayer data={chartData}>
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
                activeDot={{r: 6}}
              />
              <Line
                type="monotone"
                dataKey="Asistencias"
                stroke="var(--color-Asistencias)"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{r: 6}}
              />
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
