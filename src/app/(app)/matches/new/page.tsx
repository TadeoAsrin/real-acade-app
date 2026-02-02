"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const playerStatsSchema = z.object({
  goals: z.coerce.number().min(0).default(0),
});

const formSchema = z.object({
  date: z.date({
    required_error: "Se requiere una fecha para el partido.",
  }),
  teamAStats: z.record(playerStatsSchema),
  teamBStats: z.record(playerStatsSchema),
  teamACaptainId: z.string({ required_error: "Debes seleccionar un capitán." }),
  teamBCaptainId: z.string({ required_error: "Debes seleccionar un capitán." }),
  mvpPlayerId: z.string().optional(),
  bestGoalPlayerId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewMatchPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const currentUser = getPlayerById("1"); // In a real app this would come from auth.

  React.useEffect(() => {
    if (currentUser?.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [currentUser, router]);

  const teamAPlayers = players.filter((p) => p.team === "Amigos de Martes");
  const teamBPlayers = players.filter((p) => p.team === "Resto del Mundo");
  const allMatchPlayers = [...teamAPlayers, ...teamBPlayers];

  const defaultValues = {
    date: new Date(),
    teamAStats: Object.fromEntries(
      teamAPlayers.map((p) => [p.id, { goals: 0 }])
    ),
    teamBStats: Object.fromEntries(
      teamBPlayers.map((p) => [p.id, { goals: 0 }])
    ),
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  
  const watchedStats = form.watch(['teamAStats', 'teamBStats']);
  const scorers = React.useMemo(() => {
    const scorerIds = new Set<string>();
    const teamAStats = watchedStats[0] || {};
    const teamBStats = watchedStats[1] || {};

    Object.entries(teamAStats).forEach(([playerId, stats]) => {
      if (stats.goals > 0) scorerIds.add(playerId);
    });
    Object.entries(teamBStats).forEach(([playerId, stats]) => {
      if (stats.goals > 0) scorerIds.add(playerId);
    });
    
    return allMatchPlayers.filter(p => scorerIds.has(p.id));
  }, [watchedStats, allMatchPlayers]);

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    
    console.log(data);
    toast({
      title: "Partido Guardado",
      description: "Las estadísticas del partido se han guardado correctamente.",
    });
    router.push("/matches");
  }
  
  if (currentUser?.role !== 'admin') {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  const renderPlayerGoalsFields = (team: "A" | "B") => {
    const playerList = team === "A" ? teamAPlayers : teamBPlayers;
    const teamKey = team === "A" ? "teamAStats" : "teamBStats";

    return playerList.map((player) => (
      <div
        key={player.id}
        className="flex items-center gap-4 rounded-md border p-4"
      >
        <Avatar>
          <AvatarImage src={player.avatar} alt={player.name} />
          <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <span className="flex-1 font-medium">{player.name}</span>
        <div className="flex items-center gap-4">
          <FormField
            control={form.control}
            name={`${teamKey}.${player.id}.goals`}
            render={({ field }) => (
              <FormItem className="w-24">
                <FormLabel>Goles</FormLabel>
                <FormControl>
                  <Input type="number" min="0" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>
    ));
  };
  
  const renderCaptainSelector = (team: "A" | "B") => {
    const playerList = team === "A" ? teamAPlayers : teamBPlayers;
    const fieldName = team === "A" ? "teamACaptainId" : "teamBCaptainId";

    return (
      <FormField
        control={form.control}
        name={fieldName}
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel className="text-base">Seleccionar Capitán</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {playerList.map(player => (
                  <FormItem key={player.id} className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value={player.id} />
                    </FormControl>
                    <FormLabel className="font-normal flex items-center gap-2">
                       <Avatar className="h-6 w-6">
                          <AvatarImage src={player.avatar} alt={player.name} />
                          <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      {player.name}
                    </FormLabel>
                  </FormItem>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cargar Nuevo Partido</CardTitle>
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: es })
                          ) : (
                            <span>Elige una fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
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
                <AccordionTrigger className="text-xl font-semibold text-primary">
                  Amigos de Martes
                </AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                  {renderCaptainSelector('A')}
                  <div>
                    <h4 className="font-medium text-base mb-4">Goles por Jugador</h4>
                    <div className="space-y-4">{renderPlayerGoalsFields("A")}</div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="team-b">
                <AccordionTrigger className="text-xl font-semibold text-accent">
                  Resto del Mundo
                </AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                  {renderCaptainSelector('B')}
                   <div>
                    <h4 className="font-medium text-base mb-4">Goles por Jugador</h4>
                    <div className="space-y-4">{renderPlayerGoalsFields("B")}</div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <Card>
              <CardHeader>
                  <CardTitle>Premios del Partido</CardTitle>
                  <CardDescription>Selecciona el mejor jugador y el mejor gol.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                      control={form.control}
                      name="mvpPlayerId"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel className="flex items-center gap-2"><Star className="text-yellow-400"/> Mejor Jugador (MVP)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                              <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un jugador" />
                              </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {allMatchPlayers.map(player => (
                                  <SelectItem key={player.id} value={player.id}>{player.name}</SelectItem>
                                ))}
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
                          <FormLabel className="flex items-center gap-2"><Award className="text-primary"/> Mejor Gol</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={scorers.length === 0}>
                              <FormControl>
                              <SelectTrigger>
                                  <SelectValue placeholder={scorers.length > 0 ? "Selecciona un goleador" : "No hubo goles"} />
                              </SelectTrigger>
                              </FormControl>
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

            <Button type="submit" disabled={isLoading} size="lg">
                 {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 Guardar Partido
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
