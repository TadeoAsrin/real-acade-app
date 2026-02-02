import { getAggregatedPlayerStats } from "@/lib/data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function PlayersPage() {
  const playerStats = getAggregatedPlayerStats();

  return (
    <Card>
        <CardHeader>
            <CardTitle>Todos los Jugadores</CardTitle>
            <CardDescription>Estadísticas acumuladas de todos los jugadores.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Jugador</TableHead>
                    <TableHead className="text-center">Partidos</TableHead>
                    <TableHead className="text-center">Goles</TableHead>
                    <TableHead className="text-center">Asistencias</TableHead>
                    <TableHead className="text-center">Faltas</TableHead>
                    <TableHead className="text-center">Rating</TableHead>
                    <TableHead className="text-center">Capitán</TableHead>
                    <TableHead className="text-center">MVP</TableHead>
                    <TableHead className="text-center">Mejor Gol</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {playerStats.map((player) => (
                    <TableRow key={player.playerId}>
                        <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                            <AvatarImage src={player.avatar} alt={player.name} />
                            <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <Link href={`/players/${player.playerId}`} className="font-medium hover:underline">{player.name}</Link>
                        </div>
                        </TableCell>
                        <TableCell className="text-center font-mono">{player.matchesPlayed}</TableCell>
                        <TableCell className="text-center font-mono">{player.totalGoals}</TableCell>
                        <TableCell className="text-center font-mono">{player.totalAssists}</TableCell>
                        <TableCell className="text-center font-mono">{player.totalFouls}</TableCell>
                        <TableCell className="text-center font-mono">{player.averageRating ? player.averageRating.toFixed(1) : '-'}</TableCell>
                        <TableCell className="text-center font-mono">{player.totalCaptaincies}</TableCell>
                        <TableCell className="text-center font-mono">{player.totalMvp}</TableCell>
                        <TableCell className="text-center font-mono">{player.totalBestGoals}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
  );
}
