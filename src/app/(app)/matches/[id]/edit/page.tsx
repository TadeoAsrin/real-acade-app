
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2, Award, Star, ArrowLeft } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useDoc, useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, doc, updateDoc } from "firebase/firestore";
import type { Player, Match } from "@/lib/definitions";
import Link from "next/link";

const playerStatsSchema = z.object({
  goals: z.coerce.number().min(0).default(0),
});

const formSchema = z.object({
  date: z.date({
    required_error: "Se requiere una fecha para el partido.",
  }),
  teamAPlayerIds: z
    .array(z.string())
    .min(1, "Selecciona al menos un jugador para el equipo Azul")
    .max(7, "El equipo Azul no puede tener más de 7 jugadores"),
  teamBPlayerIds: z
    .array(z.string())
    .min(1, "Selecciona al menos un jugador para el equipo Rojo")
    .max(7, "El equipo Rojo no puede tener más de 7 jugadores"),
  teamAStats: z.record(playerStatsSchema),
  teamBStats: z.record(playerStatsSchema),
  teamACaptainId: z.string({ required_error: "Selecciona un capitán para el equipo Azul" }),
  teamBCaptainId: z.string({ required_error: "Selecciona un capitán para el equipo Rojo" }),
  mvpPlayerId: z.string().optional(),
  bestGoalPlayerId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditMatchPage() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = React.useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  const matchRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'matches', id);
  }, [firestore, id]);

  const playersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'players');
  }, [firestore]);

  const { data: match, isLoading: matchLoading } = useDoc<Match>(matchRef);
  const { data: playersData, isLoading: playersLoading } = useCollection<Player>(playersRef);
  const players = playersData || [];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teamAPlayerIds: [],
      teamBPlayerIds: [],
      teamAStats: {},
      teamBStats: {},
      teamACaptainId: "",
      teamBCaptainId: "",
      mvpPlayerId: "",
      bestGoalPlayerId: "",
    },
  });

  // Reset form when match data is loaded
  React.useEffect(() => {
    if (match) {
      const teamAStats: Record<string, { goals: number }> = {};
      const teamBStats: Record<string, { goals: number }> = {};
      
      match.teamAPlayers.forEach(p => {
        teamAStats[p.playerId] = { goals: p.goals };
      });
      match.teamBPlayers.forEach(p => {
        teamBStats[p.playerId] = { goals: p.goals };
      });

      form.reset({
        date: parseISO(match.date),
        teamAPlayerIds: match.teamAPlayers.map(p => p.playerId),
        teamBPlayerIds: match.teamBPlayers.map(p => p.playerId),
        teamAStats,
        teamBStats,
        teamACaptainId: match.teamAPlayers.find(p => p.isCaptain)?.playerId || "",
        teamBCaptainId: match.teamBPlayers.find(p => p.isCaptain)?.playerId || "",
        mvpPlayerId: match.teamAPlayers.find(p => p.isMvp)?.playerId || match.teamBPlayers.find(p => p.isMvp)?.playerId || "",
        bestGoalPlayerId: match.teamAPlayers.find(p => p.hasBestGoal)?.playerId || match.teamBPlayers.find(p => p.hasBestGoal)?.playerId || "",
      });
    }
  }, [match, form]);

  const { control } = form;
  const watchedTeamAPlayerIds = useWatch({ control, name: "teamAPlayerIds" }) || [];
  const watchedTeamBPlayerIds = useWatch({ control, name: "teamBPlayerIds" }) || [];
  const watchedTeamAStats = useWatch({ control, name: "teamAStats" }) || {};
  const watchedTeamBStats = useWatch({ control, name: "teamBStats" }) || {};

  const allSelectedPlayerIds = React.useMemo(() => 
    [...watchedTeamAPlayerIds, ...watchedTeamBPlayerIds], 
    [watchedTeamAPlayerIds, watchedTeamBPlayerIds]
  );

  const scorers = React.useMemo(() => {
    const scorerIds = new Set<string>();
    Object.entries(watchedTeamAStats).forEach(([id, stat]) => {
      if (watchedTeamAPlayerIds.includes(id) && stat?.goals > 0) scorerIds.add(id);
    });
    Object.entries(watchedTeamBStats).forEach(([id, stat]) => {
      if (watchedTeamBPlayerIds.includes(id) && stat?.goals > 0) scorerIds.add(id);
    });
    return players.filter(p => scorerIds.has(p.id));
  }, [watchedTeamAStats, watchedTeamBStats, watchedTeamAPlayerIds, watchedTeamBPlayerIds, players]);

  async function onSubmit(data: FormValues) {
    if (!firestore || !id) return;
    setIsSaving(true);
    
    try {
        const teamAPlayers = data.teamAPlayerIds.map(playerId => ({
            playerId,
            goals: data.teamAStats[playerId]?.goals || 0,
            isCaptain: data.teamACaptainId === playerId,
            isMvp: data.mvpPlayerId === playerId,
            hasBestGoal: data.bestGoalPlayerId === playerId
        }));
        const teamBPlayers = data.teamBPlayerIds.map(playerId => ({
            playerId,
            goals: data.teamBStats[playerId]?.goals || 0,
            isCaptain: data.teamBCaptainId === playerId,
            isMvp: data.mvpPlayerId === playerId,
            hasBestGoal: data.bestGoalPlayerId === playerId
        }));

        const teamAScore = teamAPlayers.reduce((sum, p) => sum + p.goals, 0);
        const teamBScore = teamBPlayers.reduce((sum, p) => sum + p.goals, 0);

        await updateDoc(doc(firestore, 'matches', id), {
            date: data.date.toISOString(),
            teamAScore,
            teamBScore,
            teamAPlayers,
            teamBPlayers,
        });

        toast({
          title: "Partido Actualizado",
          description: "Los cambios se han guardado correctamente.",
        });
        router.push(`/matches/${id}`);
    } catch (error) {
        console.error("Error updating match:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo actualizar el partido.",
        });
    } finally {
        setIsSaving(false);
    }
  }

  const renderPlayerListSelection = (team: "A" | "B") => {
    const fieldName = team === "A" ? "teamAPlayerIds" : "teamBPlayerIds";
    const currentTeamIds = team === "A" ? watchedTeamAPlayerIds : watchedTeamBPlayerIds;
    const otherTeamIds = team === "A" ? watchedTeamBPlayerIds : watchedTeamAPlayerIds;
    const isTeamFull = currentTeamIds.length >= 7;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/50">
        {players.map((player) => {
          const isSelectedInOtherTeam = otherTeamIds.includes(player.id);
          const isSelectedInThisTeam = currentTeamIds.includes(player.id);
          const isDisabled = isSelectedInOtherTeam || (isTeamFull && !isSelectedInThisTeam);
          
          return (
            <FormField
              key={player.id}
              control={form.control}
              name={fieldName}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value?.includes(player.id)}
                      disabled={isDisabled}
                      onCheckedChange={(checked) => {
                        const current = field.value || [];
                        if (checked) {
                          field.onChange([...current, player.id]);
                        } else {
                          field.onChange(current.filter((value) => value !== player.id));
                        }
                      }}
                    />
                  </FormControl>
                  <FormLabel className={cn(
                    "flex items-center gap-2 font-normal cursor-pointer", 
                    isDisabled && "opacity-40 cursor-not-allowed"
                  )}>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={player.avatar} alt={player.name} />
                      <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className={cn(isSelectedInOtherTeam && "text-muted-foreground line-through")}>
                      {player.name}
                    </span>
                  </FormLabel>
                </FormItem>
              )}
            />
          );
        })}
      </div>
    );
  };

  const renderTeamStatsEntry = (team: "A" | "B") => {
    const selectedIds = team === "A" ? watchedTeamAPlayerIds : watchedTeamBPlayerIds;
    const teamKey = team === "A" ? "teamAStats" : "teamBStats";
    const captainField = team === "A" ? "teamACaptainId" : "teamBCaptainId";

    if (selectedIds.length === 0) return <p className="text-sm text-muted-foreground p-4">Selecciona jugadores para ingresar sus estadísticas.</p>;

    return (
      <div className="space-y-6 pt-4">
        <FormField
          control={form.control}
          name={captainField}
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="text-base font-semibold">¿Quién fue el Capitán?</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value || ""}
                  className="grid grid-cols-1 md:grid-cols-2 gap-3"
                >
                  {selectedIds.map(playerId => {
                    const player = players.find(p => p.id === playerId);
                    if (!player) return null;
                    return (
                      <FormItem key={playerId} className="flex items-center space-x-3 space-y-0 border p-3 rounded-md hover:bg-accent/50 transition-colors cursor-pointer">
                        <FormControl><RadioGroupItem value={playerId} /></FormControl>
                        <FormLabel className="font-normal flex items-center gap-2 cursor-pointer w-full">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={player.avatar} alt={player.name} />
                            <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {player.name}
                        </FormLabel>
                      </FormItem>
                    );
                  })}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormLabel className="text-base font-semibold">Goles Marcados</FormLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedIds.map(playerId => {
              const player = players.find(p => p.id === playerId);
              if (!player) return null;
              return (
                <div key={playerId} className="flex items-center justify-between p-3 border rounded-md bg-background shadow-sm">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={player.avatar} alt={player.name} />
                      <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">{player.name}</span>
                  </div>
                  <FormField
                    control={form.control}
                    name={`${teamKey}.${playerId}.goals`}
                    render={({ field }) => (
                      <FormItem className="w-20">
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            {...field} 
                            value={field.value ?? 0}
                            className="h-8" 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (playersLoading || matchLoading) {
      return (
          <div className="flex h-[50vh] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      );
  }

  if (!match) return <div className="text-center py-12">Partido no encontrado.</div>;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/matches/${id}`}><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Editar Partido</h1>
      </div>

      <Card className="border-t-4 border-t-yellow-500">
        <CardHeader>
          <CardTitle>Modificar Estadísticas</CardTitle>
          <CardDescription>Actualiza los datos del encuentro realizado el {format(parseISO(match.date), "PPP", { locale: es })}.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha del Partido</FormLabel>
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className={cn("w-full md:w-[240px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => { field.onChange(date); setIsCalendarOpen(false); }}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          locale={es}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-6">
                <Accordion type="multiple" className="w-full space-y-4" defaultValue={['team-a', 'team-b']}>
                  <AccordionItem value="team-a" className="border rounded-lg px-4 bg-primary/5">
                    <AccordionTrigger className="text-xl font-bold text-primary hover:no-underline">Equipo Azul</AccordionTrigger>
                    <AccordionContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-base">Seleccionar Jugadores</FormLabel>
                          <span className={cn("text-sm", watchedTeamAPlayerIds.length === 7 ? "text-primary font-bold" : "text-muted-foreground")}>
                            {watchedTeamAPlayerIds.length}/7
                          </span>
                        </div>
                        {renderPlayerListSelection('A')}
                        <FormMessage>{form.formState.errors.teamAPlayerIds?.message}</FormMessage>
                      </div>
                      {renderTeamStatsEntry('A')}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="team-b" className="border rounded-lg px-4 bg-accent/5">
                    <AccordionTrigger className="text-xl font-bold text-accent hover:no-underline">Equipo Rojo</AccordionTrigger>
                    <AccordionContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-base">Seleccionar Jugadores</FormLabel>
                          <span className={cn("text-sm", watchedTeamBPlayerIds.length === 7 ? "text-accent font-bold" : "text-muted-foreground")}>
                            {watchedTeamBPlayerIds.length}/7
                          </span>
                        </div>
                        {renderPlayerListSelection('B')}
                        <FormMessage>{form.formState.errors.teamBPlayerIds?.message}</FormMessage>
                      </div>
                      {renderTeamStatsEntry('B')}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              <Card className="bg-muted/30 border-dashed">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="text-yellow-500 h-5 w-5" /> Premios y Reconocimientos
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="mvpPlayerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mejor Jugador (MVP)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Selecciona el MVP" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {allSelectedPlayerIds.map(playerId => {
                                const player = players.find(p => p.id === playerId);
                                return (
                                    <SelectItem key={playerId} value={playerId}>{player?.name}</SelectItem>
                                );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bestGoalPlayerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mejor Gol</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl><SelectTrigger><SelectValue placeholder={scorers.length > 0 ? "Selecciona el mejor gol" : "Sin goleadores"} /></SelectTrigger></FormControl>
                          <SelectContent>
                            {scorers.map(player => (
                              <SelectItem key={player.id} value={player.id}>{player.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end pt-4">
                <Button type="submit" size="lg" className="w-full md:w-auto" disabled={isSaving}>
                  {isSaving ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
                  ) : (
                    "Guardar Cambios"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
