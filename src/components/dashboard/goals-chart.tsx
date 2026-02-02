"use client";

import { matches } from "@/lib/data";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
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
import { ChartTooltipContent } from "../ui/chart";

export function GoalsChart() {
  const chartData = matches
    .map((match) => ({
      date: new Date(match.date).toLocaleDateString("es-ES", {
        month: "short",
        day: "numeric",
      }),
      goals: match.teamAScore + match.teamBScore,
    }))
    .reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rendimiento General</CardTitle>
        <CardDescription>Goles totales por partido.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: "hsl(var(--secondary))" }}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar dataKey="goals" fill="hsl(var(--primary))" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
