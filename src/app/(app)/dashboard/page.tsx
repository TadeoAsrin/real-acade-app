import { getAggregatedPlayerStats, getPlayerById, matches, players } from "@/lib/data";
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
import { Award, Medal, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GoalsChart } from "@/components/dashboard/goals-chart";
import { FieldView } from "@/components/dashboard/field-view";

export default function DashboardPage() {
  const playerStats = getAggregatedPlayerStats();
  const currentUser = getPlayerById("1");
  const lastMatch = matches[0]; // El partido más reciente

  const topScorers = [...playerStats]
    .sort((a, b) => b.totalGoals - a.totalGoals)
    .slice(0, 5);
  
  const topWinner = [...playerStats]
    .sort((a, b) => b.wins - a.wins)[0];

  const totalGoals = playerStats.reduce((sum, p) => sum + p.totalGoals, 0);
  const totalMatches = matches.length;

  // Obtener los jugadores del último partido para la vista de campo
  const lastMatchTeamAPlayers = lastMatch?.teamAPlayers.map(s => getPlayerById(s.playerId)).filter(Boolean) as any[] || [];
  const lastMatchTeamBPlayers = lastMatch?.teamBPlayers.map(s => getPlayerById(s.playerId)).filter(Boolean) as any[] || [];

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partidos Jugados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMatches}</div>
            <p className="text-xs text-muted-foreground">Total de encuentros disputados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goles Totales</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGoals}</div>
            <p className="text-xs text-muted-foreground">en {totalMatches} partidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Máximo Goleador</CardTitle>
            <Medal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topScorers[0].name}</div>
            <p className="text-xs text-muted-foreground">{topScorers[0].totalGoals} goles marcados</p>
          </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Máximo Ganador</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{topWinner.name}</div>
                <p className="text-xs text-muted-foreground">{topWinner.wins} victorias ({topWinner.winPercentage}%)</p>
            </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-center">Formación Último Partido: Azul</h3>
          <FieldView team="Azul" players={lastMatchTeamAPlayers} />
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-center">Formación Último Partido: Rojo</h3>
          <FieldView team="Rojo" players={lastMatchTeamBPlayers} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tabla de Goleadores</CardTitle>
            <CardDescription>Top 5 jugadores con más goles.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jugador</TableHead>
                  <TableHead className="text-center">Goles</TableHead>
                  <TableHead className="text-right">Efectividad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topScorers.map((player) => (
                  <TableRow key={player.playerId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={player.avatar} alt={player.name} />
                          <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Link href={`/players/${player.playerId}`} className="font-medium hover:underline">{player.name}</Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono">{player.totalGoals}</TableCell>
                    <TableCell className="text-right font-mono">{player.winPercentage}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <GoalsChart />
      </div>

       {currentUser?.role === 'admin' && (
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle>Administración</CardTitle>
                    <CardDescription>Gestión de datos del club.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button size="sm" asChild>
                        <Link href="/matches/new">Cargar Nuevo Partido</Link>
                    </Button>
                </CardContent>
            </Card>
        )}
    </div>
  );
}
