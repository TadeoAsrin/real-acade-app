import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { matches, getPlayerById } from "@/lib/data";
import { cn } from "@/lib/utils";
import { ArrowUpRight, CalendarIcon } from "lucide-react";
import Link from "next/link";

export default function MatchesPage() {
  const currentUser = getPlayerById("1"); // In a real app, this would come from auth

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Historial de Partidos</h1>
          {currentUser?.role === 'admin' && (
            <Button asChild>
                <Link href="/matches/new">Cargar Nuevo Partido</Link>
            </Button>
          )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {matches.map((match) => {
          const teamAWon = match.teamAScore > match.teamBScore;
          const teamBWon = match.teamBScore > match.teamAScore;
          const draw = match.teamAScore === match.teamBScore;

          return (
            <Card key={match.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold">{new Date(match.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/matches/${match.id}`}>Ver Detalles <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                </CardHeader>
              <CardContent>
                <div className="flex items-center justify-around">
                  <div className="flex flex-col items-center gap-2">
                    <span
                      className={cn(
                        "text-lg font-semibold",
                        (draw || teamAWon) ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      Amigos de Martes
                    </span>
                    <span className="text-5xl font-bold text-primary">{match.teamAScore}</span>
                  </div>
                  <div className="text-4xl font-light text-muted-foreground">
                    vs
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <span
                      className={cn(
                        "text-lg font-semibold",
                        (draw || teamBWon) ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      Resto del Mundo
                    </span>
                    <span className="text-5xl font-bold text-accent">{match.teamBScore}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
