"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { players, getPlayerById } from "@/lib/data";
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
import { CalendarIcon, Loader2, Award, Star, Users } from "lucide-react";
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

const playerStatsSchema = z.object({
  goals: z.coerce.number().min(0).default(0),
});

const formSchema = z.object({
  date: z.date({
    required_error: "Se requiere una fecha para el partido.",
  }),
  teamAPlayerIds: z.array(z.string()).min(1, "Selecciona al menos un jugador para el equipo Azul"),
  teamBPlayerIds: z.array(z.string()).min(1, "Selecciona al menos un jugador para el equipo Rojo"),
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
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const currentUser = getPlayerById("1");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      teamAPlayerIds: [],
      teamBPlayerIds: [],
      teamAStats: {},
      teamBStats: {},
    },
  });

  const { control, setValue } = form;
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
      if (watchedTeamAPlayerIds.includes(id) && stat.goals > 0) scorerIds.add(id);
    });
    Object.entries(watchedTeamBStats).forEach(([id, stat]) => {
      if (watchedTeamBPlayerIds.includes(id) && stat.goals > 0) scorerIds.add(id);
    });
    return players.filter(p => scorerIds.has(p.id));
  }, [watchedTeamAStats, watchedTeamBStats, watchedTeamAPlayerIds, watchedTeamBPlayerIds]);

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    
    toast({
      title: "Partido Guardado",
      description: "Las estadísticas del partido se han guardado correctamente.",
    });
    router.push("/matches");
  }

  const renderPlayerListSelection = (team: "A" | "B") => {
    const fieldName = team === "A" ? "teamAPlayerIds" : "teamBPlayerIds";
    const otherTeamIds = team === "A" ? watchedTeamBPlayerIds : watchedTeamAPlayerIds;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/50">
        {players.map((player) => {
          const isDisabled = otherTeamIds.includes(player.id);
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
                  <FormLabel className="flex items-center gap-2 font-normal cursor-pointer">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={player.avatar} alt={player.name} />
                      <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className={isDisabled ? "text-muted-foreground line-through" : ""}>
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
              <FormLabel className="text-base">Seleccionar Capitán</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {selectedIds.map(id => {
                    const player = getPlayerById(id);
                    if (!player) return null;
                    return (
                      <FormItem key={id} className="flex items-center space-x-3 space-y-0 border p-3 rounded-md">
                        <FormControl><RadioGroupItem value={id} /></FormControl>
                        <FormLabel className="font-normal flex items-center gap-2">
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
          <FormLabel className="text-base">Goles Marcados</FormLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedIds.map(id => {
              const player = getPlayerById(id);
              if (!player) return null;
              return (
                <div key={id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={player.avatar} alt={player.name} />
                      <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{player.name}</span>
                  </div>
                  <FormField
                    control={form.control}
                    name={`${teamKey}.${id}.goals`}
                    render={({ field }) => (
                      <FormItem className="w-20">
                        <FormControl><Input type="number" min="0" {...field} /></FormControl>
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

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Cargar Nuevo Partido</CardTitle>
          <CardDescription>Completa la información del encuentro semanal.</CardDescription>
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
                          <Button variant="outline" className={cn("w-[240px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
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
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Accordion type="multiple" className="w-full" defaultValue={['team-a', 'team-b']}>
                <AccordionItem value="team-a">
                  <AccordionTrigger className="text-xl font-semibold text-primary">Equipo Azul</AccordionTrigger>
                  <AccordionContent className="space-y-6">
                    <div>
                      <FormLabel className="mb-4 block">Seleccionar Jugadores</FormLabel>
                      {renderPlayerListSelection('A')}
                      <FormMessage>{form.formState.errors.teamAPlayerIds?.message}</FormMessage>
                    </div>
                    {renderTeamStatsEntry('A')}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="team-b">
                  <AccordionTrigger className="text-xl font-semibold text-accent">Equipo Rojo</AccordionTrigger>
                  <AccordionContent className="space-y-6">
                    <div>
                      <FormLabel className="mb-4 block">Seleccionar Jugadores</FormLabel>
                      {renderPlayerListSelection('B')}
                      <FormMessage>{form.formState.errors.teamBPlayerIds?.message}</FormMessage>
                    </div>
                    {renderTeamStatsEntry('B')}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <Card className="bg-muted/30">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Award /> Premios del Partido</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="mvpPlayerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Star className="text-yellow-500"/> Mejor Jugador (MVP)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={allSelectedPlayerIds.length === 0}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {allSelectedPlayerIds.map(id => (
                              <SelectItem key={id} value={id}>{getPlayerById(id)?.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bestGoalPlayerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Award className="text-primary"/> Mejor Gol</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={scorers.length === 0}>
                          <FormControl><SelectTrigger><SelectValue placeholder={scorers.length > 0 ? "Selecciona" : "Sin goleadores"} /></SelectTrigger></FormControl>
                          <SelectContent>
                            {scorers.map(player => (
                              <SelectItem key={player.id} value={player.id}>{player.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button type="submit" size="lg" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Resultados
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
