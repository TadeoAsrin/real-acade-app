
import { getAggregatedStatsForPlayer, getMatchHistoryForPlayer, getPlayerById } from "@/lib/data";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Goal, Star, Shield, Users, Trophy, Award, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { PlayerPerformanceChart } from "@/components/players/player-performance-chart";

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
          <p className={player.team === 'Amigos de Martes' ? 'text-primary' : 'text-accent'}>{player.team}</p>
          <p className="text-muted-foreground">{player.positionName}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partidos Jugados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{playerStats.matchesPlayed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goles Totales</CardTitle>
            <Goal className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{playerStats.totalGoals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efectividad</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{playerStats.winPercentage}%</div>
            <p className="text-xs text-muted-foreground">
              {playerStats.wins} G, {playerStats.losses} P, {playerStats.draws} E
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating Promedio</CardTitle>
            <Star className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{playerStats.averageRating ? playerStats.averageRating.toFixed(1) : 'N/A'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capitán</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{playerStats.totalCaptaincies}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MVP</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{playerStats.totalMvp}</div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mejor Gol</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{playerStats.totalBestGoals}</div>
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
                <TableHead className="text-center">Goles</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matchHistory.map((match) => (
                <TableRow key={match.matchId}>
                  <TableCell>{new Date(match.date).toLocaleDateString('es-ES', { month: 'long', day: 'numeric', year: 'numeric' })}</TableCell>
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
