"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
import type { Match } from "@/lib/definitions";

const chartConfig = {
  azul: {
    label: "Equipo Azul",
    color: "hsl(var(--primary))",
  },
  rojo: {
    label: "Equipo Rojo",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig;

interface GoalsChartProps {
  matches: Match[];
}

export function GoalsChart({ matches }: GoalsChartProps) {
  const chartData = [...matches]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((match) => ({
      date: new Date(match.date).toLocaleDateString("es-ES", {
        month: "short",
        day: "numeric",
      }),
      azul: match.teamAScore,
      rojo: match.teamBScore,
    }))
    .slice(-10); // Mostramos los últimos 10

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
