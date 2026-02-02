"use client";

import type { PlayerStats } from "@/lib/definitions";
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { ChartTooltipContent } from "../ui/chart";

type PerformanceChartProps = {
  matchHistory: (PlayerStats & { matchId: string; date: string })[];
};

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
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Goles"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Asistencias"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--accent))", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
