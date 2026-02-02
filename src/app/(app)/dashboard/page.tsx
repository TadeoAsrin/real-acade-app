import { getAggregatedPlayerStats, getPlayerById } from "@/lib/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, BarChart3, Medal, Trophy } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GoalsChart } from "@/components/dashboard/goals-chart";
import { ChartContainer } from "@/components/ui/chart";

export default function DashboardPage() {
  const playerStats = getAggregatedPlayerStats();
  const currentUser = getPlayerById("1"); // In a real app, this would come from auth

  const topScorers = [...playerStats]
    .sort((a, b) => b.totalGoals - a.totalGoals)
    .slice(0, 5);

  const topAssistants = [...playerStats]
    .sort((a, b) => b.totalAssists - a.totalAssists)
    .slice(0, 5);

  const totalGoals = playerStats.reduce((sum, p) => sum + p.totalGoals, 0);
  const totalMatches = 3; // Hardcoded from mock data

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goles Totales</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGoals}</div>
            <p className="text-xs text-muted-foreground">
              en {totalMatches} partidos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Máximo Goleador</CardTitle>
            <Medal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topScorers[0].name}</div>
            <p className="text-xs text-muted-foreground">
              {topScorers[0].totalGoals} goles en {topScorers[0].matchesPlayed} partidos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Máximo Asistidor
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topAssistants[0].name}</div>
            <p className="text-xs text-muted-foreground">
              {topAssistants[0].totalAssists} asistencias en {topAssistants[0].matchesPlayed} partidos
            </p>
          </CardContent>
        </Card>
        {currentUser?.role === 'admin' && (
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle>Cargar Partido</CardTitle>
                    <CardDescription>Añade los datos del último encuentro.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button size="sm" asChild>
                        <Link href="/matches/new">Nuevo Partido</Link>
                    </Button>
                </CardContent>
            </Card>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tabla de Goleadores</CardTitle>
            <CardDescription>
              Top 5 jugadores con más goles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jugador</TableHead>
                  <TableHead className="text-right">Goles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topScorers.map((player) => (
                  <TableRow key={player.playerId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={player.avatar} alt={player.name} />
                          <AvatarFallback>
                            {player.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <Link href={`/players/${player.playerId}`} className="font-medium hover:underline">{player.name}</Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">{player.totalGoals}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tabla de Asistencias</CardTitle>
            <CardDescription>
              Top 5 jugadores con más asistencias.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jugador</TableHead>
                  <TableHead className="text-right">Asistencias</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topAssistants.map((player) => (
                  <TableRow key={player.playerId}>
                    <TableCell>
                       <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={player.avatar} alt={player.name} />
                          <AvatarFallback>
                            {player.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <Link href={`/players/${player.playerId}`} className="font-medium hover:underline">{player.name}</Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">{player.totalAssists}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <ChartContainer config={{}} className="h-80 w-full">
        <GoalsChart />
      </ChartContainer>
    </div>
  );
}
