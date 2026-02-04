
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
  FormDescription,
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
import { cn, getInitials } from "@/lib/utils";
import { CalendarIcon, Loader2, Award, Star, Camera, MessageSquare, Plus, Trash2, Sparkles } from "lucide-react";
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
import { useCollection, useMemoFirebase, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { collection, doc, serverTimestamp, query, orderBy } from "firebase/firestore";
import type { Player } from "@/lib/definitions";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { generateMatchSummary } from "@/ai/flows/match-summary-flow";

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
  comment: z.string().optional(),
  photos: z.array(z.string().url("Debe ser una URL válida")).max(5, "Máximo 5 fotos"),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewMatchPage() {
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [photoUrl, setPhotoUrl] = React.useState("");

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
      comment: "",
      photos: [],
    },
  });

  const { control } = form;
  const watchedTeamAPlayerIds = useWatch({ control, name: "teamAPlayerIds" }) || [];
  const watchedTeamBPlayerIds = useWatch({ control, name: "teamBPlayerIds" }) || [];
  const watchedTeamAStats = useWatch({ control, name: "teamAStats" }) || {};
  const watchedTeamBStats = useWatch({ control, name: "teamBStats" }) || {};
  const watchedPhotos = useWatch({ control, name: "photos" }) || [];

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

      // Generar el resumen de IA antes de guardar
      let aiSummary;
      const aiInput = {
        date: data.date.toISOString(),
        teamAScore,
        teamBScore,
        teamAPlayers: teamAPlayers.map(s => ({ name: players.find(p => p.id === s.playerId)?.name || '?', goals: s.goals })),
        teamBPlayers: teamBPlayers.map(s => ({ name: players.find(p => p.id === s.playerId)?.name || '?', goals: s.goals })),
        mvpName: players.find(p => p.id === data.mvpPlayerId)?.name,
        bestGoalName: players.find(p => p.id === data.bestGoalPlayerId)?.name,
      };

      const aiResult = await generateMatchSummary(aiInput);
      if (aiResult && !('error' in aiResult)) {
        aiSummary = aiResult;
      }

      const matchRef = doc(collection(firestore, 'matches'));
      const matchData = {
          date: data.date.toISOString(),
          teamAScore,
          teamBScore,
          teamAPlayers,
          teamBPlayers,
          comment: data.comment,
          photos: data.photos,
          aiSummary: aiSummary || null,
          createdAt: serverTimestamp()
      };

      setDocumentNonBlocking(matchRef, matchData, {});

      toast({
        title: "Partido Guardado",
        description: "Las estadísticas y la crónica se han guardado correctamente.",
      });
      router.push("/matches");
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar el partido." });
    } finally {
      setIsLoading(false);
    }
  }

  const addPhoto = () => {
    if (photoUrl && watchedPhotos.length < 5) {
      form.setValue("photos", [...watchedPhotos, photoUrl]);
      setPhotoUrl("");
    }
  };

  const removePhoto = (idx: number) => {
    form.setValue("photos", watchedPhotos.filter((_, i) => i !== idx));
  };

  const renderPlayerListSelection = (team: "A" | "B") => {
    const fieldName = team === "A" ? "teamAPlayerIds" : "teamBPlayerIds";
    const currentTeamIds = team === "A" ? watchedTeamAPlayerIds : watchedTeamBPlayerIds;
    const otherTeamIds = team === "A" ? watchedTeamBPlayerIds : watchedTeamAPlayerIds;
    const isTeamFull = currentTeamIds.length >= 7;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-xl bg-muted/30">
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
                      <AvatarFallback className="text-[8px] font-black">{getInitials(player.name)}</AvatarFallback>
                    </Avatar>
                    <span className={cn("text-xs font-bold", isSelectedInOtherTeam && "text-muted-foreground line-through")}>
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

    if (selectedIds.length === 0) return <p className="text-xs text-muted-foreground p-4 italic">Selecciona jugadores arriba para ingresar sus estadísticas.</p>;

    return (
      <div className="space-y-6 pt-4">
        <FormField
          control={form.control}
          name={captainField}
          render={({ field }) => (
            <FormItem className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">¿Quién fue el Capitán?</FormLabel>
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
                      <FormItem key={id} className="flex items-center space-x-3 space-y-0 border p-3 rounded-xl hover:bg-accent/50 transition-colors cursor-pointer glass-card">
                        <FormControl><RadioGroupItem value={id} /></FormControl>
                        <FormLabel className="font-normal flex items-center gap-2 cursor-pointer w-full">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={player.avatar} alt={player.name} />
                            <AvatarFallback className="text-[10px] font-black">{getInitials(player.name)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-bold">{player.name}</span>
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
          <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Producción Goleadora</FormLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedIds.map(id => {
              const player = players.find(p => p.id === id);
              if (!player) return null;
              return (
                <div key={id} className="flex items-center justify-between p-3 border rounded-xl glass-card">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={player.avatar} alt={player.name} />
                      <AvatarFallback className="text-[10px] font-black">{getInitials(player.name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-bold text-sm">{player.name}</span>
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
                            className="h-8 text-center font-black italic" 
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
    <div className="max-w-4xl mx-auto pb-20 space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">Carga de Partido</h1>
          <p className="text-muted-foreground text-sm font-medium">Registra la mística de la última jornada.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
          <Card className="glass-card border-t-4 border-t-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                1. Programación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Fecha del Encuentro</FormLabel>
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className={cn("w-full md:w-[300px] h-12 text-left font-bold rounded-xl border-white/10", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPPP", { locale: es }) : <span>Elige una fecha</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => { if(date) field.onChange(date); setIsCalendarOpen(false); }}
                          locale={es}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/50 px-1">2. Plantillas y Desempeño</h2>
            <Accordion type="multiple" className="w-full space-y-4" defaultValue={['team-a', 'team-b']}>
              <AccordionItem value="team-a" className="border rounded-2xl px-4 bg-primary/5 border-primary/10 overflow-hidden">
                <AccordionTrigger className="text-xl font-black uppercase italic text-primary hover:no-underline py-6">Equipo Azul</AccordionTrigger>
                <AccordionContent className="space-y-8 pb-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Convocados Azul</FormLabel>
                      <Badge variant="secondary" className={cn("font-black", watchedTeamAPlayerIds.length === 7 ? "bg-primary text-white" : "bg-white/5")}>
                        {watchedTeamAPlayerIds.length}/7
                      </Badge>
                    </div>
                    {renderPlayerListSelection('A')}
                    <FormMessage>{form.formState.errors.teamAPlayerIds?.message}</FormMessage>
                  </div>
                  {renderTeamStatsEntry('A')}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="team-b" className="border rounded-2xl px-4 bg-accent/5 border-accent/10 overflow-hidden">
                <AccordionTrigger className="text-xl font-black uppercase italic text-accent hover:no-underline py-6">Equipo Rojo</AccordionTrigger>
                <AccordionContent className="space-y-8 pb-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Convocados Rojo</FormLabel>
                      <Badge variant="secondary" className={cn("font-black", watchedTeamBPlayerIds.length === 7 ? "bg-accent text-white" : "bg-white/5")}>
                        {watchedTeamBPlayerIds.length}/7
                      </Badge>
                    </div>
                    {renderPlayerListSelection('B')}
                    <FormMessage>{form.formState.errors.teamBPlayerIds?.message}</FormMessage>
                  </div>
                  {renderTeamStatsEntry('B')}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                3. Honores
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="mvpPlayerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Mejor Jugador (MVP)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl><SelectTrigger className="h-12 font-bold"><SelectValue placeholder="Selecciona el MVP" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {allSelectedPlayerIds.map(id => (
                          <SelectItem key={id} value={id}>{players.find(p => p.id === id)?.name}</SelectItem>
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
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Mejor Gol</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl><SelectTrigger className="h-12 font-bold"><SelectValue placeholder={scorers.length > 0 ? "Selecciona el mejor gol" : "Sin goleadores aún"} /></SelectTrigger></FormControl>
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

          <Card className="glass-card border-emerald-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-emerald-500" />
                4. La Crónica Social
              </CardTitle>
              <CardDescription>Añade contexto y fotos de la jornada.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Resumen del Administrador</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Ej: 'Partidazo 🔥 Mucha intensidad y un final picante...'" 
                        className="min-h-[120px] rounded-xl font-medium leading-relaxed" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Galería de Fotos (Máx 5)</FormLabel>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Pega la URL de la foto..." 
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={addPhoto}
                    disabled={!photoUrl || watchedPhotos.length >= 5}
                    className="h-12 px-6 font-black uppercase italic"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Añadir
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2">
                  {watchedPhotos.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-white/10">
                      <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 bg-destructive p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4 pt-6">
            <Button type="submit" size="lg" className="h-16 font-black uppercase italic text-lg shadow-xl shadow-primary/30" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Guardando Historial...</>
              ) : (
                "Finalizar y Publicar"
              )}
            </Button>
            <div className="flex items-center justify-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <p className="text-[10px] uppercase font-black tracking-widest text-primary/60 italic">La IA generará la crónica automáticamente</p>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
