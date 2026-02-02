import { getMatchById, getPlayerById } from "@/lib/data";
import { notFound } from "next/navigation";
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
import type { Player, PlayerStats } from "@/lib/definitions";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { BestGoalVote } from "@/components/matches/best-goal-vote";
import { Award, Star } from "lucide-react";

const PlayerStatsTable = ({
  title,
  stats,
  teamColor,
}: {
  title: string;
  stats: PlayerStats[];
  teamColor: "primary" | "accent";
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className={cn(`text-${teamColor}`)}>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jugador</TableHead>
              <TableHead className="text-center">Goles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.map((stat) => {
              const player = getPlayerById(stat.playerId);
              if (!player) return null;
              return (
                <TableRow key={player.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={player.avatar} alt={player.name} />
                        <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{player.name}</span>
                       {stat.isMvp && (
                        <Badge variant="outline" className="border-yellow-400 text-yellow-400">
                          <Star className="mr-1 h-3 w-3" /> MVP
                        </Badge>
                      )}
                      {stat.hasBestGoal && (
                        <Badge variant="outline" className="border-primary text-primary">
                          <Award className="mr-1 h-3 w-3" /> Mejor Gol
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    {stat.goals}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default function MatchDetailPage({ params }: { params: { id: string } }) {
  const match = getMatchById(params.id);
  const currentUser = getPlayerById("1"); // In a real app, this would come from auth

  if (!match) {
    notFound();
  }

  const allPlayerStats = [...match.teamAPlayers, ...match.teamBPlayers];
  
  const scorers = allPlayerStats
    .filter(stat => stat.goals > 0)
    .map(stat => {
      const player = getPlayerById(stat.playerId);
      return player ? { ...player, goals: stat.goals } : null;
    })
    .filter(Boolean) as (Player & { goals: number })[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Detalles del Partido
        </h1>
        <p className="text-muted-foreground">
          {new Date(match.date).toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-around">
            <div className="flex flex-col items-center gap-2">
              <span className="text-xl font-semibold text-primary">
                Amigos de Martes
              </span>
              <span className="text-6xl font-bold text-primary">
                {match.teamAScore}
              </span>
            </div>
            <div className="text-5xl font-light text-muted-foreground">vs</div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-xl font-semibold text-accent">
                Resto del Mundo
              </span>
              <span className="text-6xl font-bold text-accent">
                {match.teamBScore}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <PlayerStatsTable
          title="Amigos de Martes"
          stats={match.teamAPlayers}
          teamColor="primary"
        />
        <PlayerStatsTable
          title="Resto del Mundo"
          stats={match.teamBPlayers}
          teamColor="accent"
        />
      </div>

      <Separator />
      
      {currentUser?.role === 'player' && (
        <div className="space-y-8">
            <BestGoalVote scorers={scorers} />
        </div>
      )}

    </div>
  );
}
