"use client";

import * as React from "react";
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
import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2, Award, Star } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
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
import { useCollection, useMemoFirebase, useFirestore, useUser } from "@/firebase";
import { collection, doc, setDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import type { Player } from "@/lib/definitions";

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

export default function NewMatchPage() {
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  const playersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'players'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: playersData, isLoading: playersLoading } = useCollection<Player>(playersRef);
  const players = playersData || [];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
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
    if (!firestore) return;
    setIsLoading(true);
    
    try {
        const matchRef = doc(collection(firestore, 'matches'));
        const teamAPlayers = data.teamAPlayerIds.map(id => ({
            playerId: id,
            goals: data.teamAStats[id]?.goals || 0,
            isCaptain: data.teamACaptainId === id,
            isMvp: data.mvpPlayerId === id,
            hasBestGoal: data.bestGoalPlayerId === id
        }));
        const teamBPlayers = data.teamBPlayerIds.map(id => ({
            playerId: id,
            goals: data.teamBStats[id]?.goals || 0,
            isCaptain: data.teamBCaptainId === id,
            isMvp: data.mvpPlayerId === id,
            hasBestGoal: data.bestGoalPlayerId === id
        }));

        const teamAScore = teamAPlayers.reduce((sum, p) => sum + p.goals, 0);
        const teamBScore = teamBPlayers.reduce((sum, p) => sum + p.goals, 0);

        await setDoc(matchRef, {
            date: data.date.toISOString(),
            teamAScore,
            teamBScore,
            teamAPlayers,
            teamBPlayers,
            createdAt: serverTimestamp()
        });

        toast({
          title: "Partido Guardado",
          description: "Las estadísticas del partido se han guardado correctamente.",
        });
        router.push("/matches");
    } catch (error) {
        console.error("Error saving match:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo guardar el partido.",
        });
    } finally {
        setIsLoading(false);
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

    if (selectedIds.length === 0) return <p className="text-sm text-muted-foreground p-4">Selecciona jugadores arriba para ingresar sus estadísticas.</p>;

    return (
      <div className="space-y-6 pt-4">
        <FormField
          control={form.control}
          name={captainField}
          render={({ field }) => (
            <FormItem className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel className="text-base font-semibold">¿Quién es el Capitán?</FormLabel>
                <span className="text-xs text-muted-foreground">{selectedIds.length}/7 jugadores</span>
              </div>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value || ""}
                  className="grid grid-cols-1 md:grid-cols-2 gap-3"
                >
                  {selectedIds.map(id => {
                    const player = players.find(p => p.id === id);
                    if (!player) return null;
                    return (
                      <FormItem key={id} className="flex items-center space-x-3 space-y-0 border p-3 rounded-md hover:bg-accent/50 transition-colors cursor-pointer">
                        <FormControl><RadioGroupItem value={id} /></FormControl>
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
            {selectedIds.map(id => {
              const player = players.find(p => p.id === id);
              if (!player) return null;
              return (
                <div key={id} className="flex items-center justify-between p-3 border rounded-md bg-background shadow-sm">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={player.avatar} alt={player.name} />
                      <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">{player.name}</span>
                  </div>
                  <FormField
                    control={form.control}
                    name={`${teamKey}.${id}.goals`}
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

  if (playersLoading) {
      return (
          <div className="flex h-[50vh] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <Card className="border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle className="text-2xl">Cargar Nuevo Partido</CardTitle>
          <CardDescription>Ingresa los detalles del encuentro. Máximo 7 jugadores por equipo.</CardDescription>
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
                        <FormLabel className="flex items-center gap-2">Mejor Jugador (MVP)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Selecciona el MVP" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {allSelectedPlayerIds.map(id => {
                                const player = players.find(p => p.id === id);
                                return (
                                    <SelectItem key={id} value={id}>{player?.name}</SelectItem>
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
                        <FormLabel className="flex items-center gap-2">Mejor Gol</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl><SelectTrigger><SelectValue placeholder={scorers.length > 0 ? "Selecciona el mejor gol" : "Sin goleadores aún"} /></SelectTrigger></FormControl>
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
                <Button type="submit" size="lg" className="w-full md:w-auto" disabled={isLoading}>
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
                  ) : (
                    "Finalizar y Guardar"
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
