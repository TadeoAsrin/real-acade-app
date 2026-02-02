"use client";

import { matches } from "@/lib/data";
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

const chartConfig = {
  amigos: {
    label: "Amigos de Martes",
    color: "hsl(var(--primary))",
  },
  resto: {
    label: "Resto del Mundo",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig;

export function GoalsChart() {
  const chartData = matches
    .map((match) => ({
      date: new Date(match.date).toLocaleDateString("es-ES", {
        month: "short",
        day: "numeric",
      }),
      amigos: match.teamAScore,
      resto: match.teamBScore,
    }))
    .reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rendimiento General</CardTitle>
        <CardDescription>Goles por equipo en cada partido.</CardDescription>
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
              dataKey="amigos"
              fill="var(--color-amigos)"
              stackId="a"
            />
            <Bar
              dataKey="resto"
              fill="var(--color-resto)"
              radius={[4, 4, 0, 0]}
              stackId="a"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
