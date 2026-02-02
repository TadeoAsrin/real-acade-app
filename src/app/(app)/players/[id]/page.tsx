import { getAggregatedStatsForPlayer, getMatchHistoryForPlayer, getPlayerById } from "@/lib/data";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Goal, Users, Trophy, Award, TrendingUp, History } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { PlayerPerformanceChart } from "@/components/players/player-performance-chart";
import { Badge } from "@/components/ui/badge";

export default function PlayerProfilePage({ params }: { params: { id: string } }) {
  const player = getPlayerById(params.id);
  const playerStats = getAggregatedStatsForPlayer(params.id);
  const matchHistory = getMatchHistoryForPlayer(params.id);

  if (!player || !playerStats) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
        <Avatar className="h-32 w-32 border-4 border-primary">
          <AvatarImage src={player.avatar} alt={player.name} />
          <AvatarFallback className="text-4xl">
            {player.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="pt-4 text-center md:text-left">
          <h1 className="text-4xl font-bold tracking-tight">{player.name}</h1>
          <p className="text-muted-foreground">Estadísticas Acumuladas</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efectividad General</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{playerStats.winPercentage}%</div>
            <p className="text-xs text-muted-foreground">
              {playerStats.wins}V - {playerStats.draws}E - {playerStats.losses}D
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partidos por Equipo</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
                <div>
                    <div className="text-2xl font-bold text-primary">{playerStats.matchesAsBlue}</div>
                    <p className="text-[10px] uppercase text-muted-foreground">Azul</p>
                </div>
                <div>
                    <div className="text-2xl font-bold text-accent">{playerStats.matchesAsRed}</div>
                    <p className="text-[10px] uppercase text-muted-foreground">Rojo</p>
                </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hitos</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex gap-4">
            <div>
                <div className="text-2xl font-bold">{playerStats.totalMvp}</div>
                <p className="text-[10px] uppercase text-muted-foreground">MVP</p>
            </div>
            <div>
                <div className="text-2xl font-bold">{playerStats.totalBestGoals}</div>
                <p className="text-[10px] uppercase text-muted-foreground">Mejor Gol</p>
            </div>
            <div>
                <div className="text-2xl font-bold">{playerStats.totalGoals}</div>
                <p className="text-[10px] uppercase text-muted-foreground">Goles</p>
            </div>
          </CardContent>
        </Card>
      </div>

       <PlayerPerformanceChart matchHistory={matchHistory} />

      <Card>
        <CardHeader>
          <CardTitle>Historial de Partidos</CardTitle>
          <CardDescription>Rendimiento en los últimos partidos.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Equipo</TableHead>
                <TableHead className="text-center">Goles</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matchHistory.map((match) => (
                <TableRow key={match.matchId}>
                  <TableCell>{new Date(match.date).toLocaleDateString('es-ES', { month: 'long', day: 'numeric', year: 'numeric' })}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={match.team === 'Azul' ? 'border-primary text-primary' : 'border-accent text-accent'}>
                        {match.team}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-mono">{match.goals}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/matches/${match.matchId}`} className="text-sm font-medium text-primary hover:underline">
                      Ver Partido
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
