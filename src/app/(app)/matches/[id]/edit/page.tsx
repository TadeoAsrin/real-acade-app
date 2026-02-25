
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, getInitials } from "@/lib/utils";
import { CalendarIcon, Loader2, Award, Star, ArrowLeft, Camera, Plus, Trash2, MessageSquare, Sparkles, Upload } from "lucide-react";
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
import { useDoc, useCollection, useMemoFirebase, useFirestore, updateDocumentNonBlocking } from "@/firebase";
import { collection, doc, query, orderBy } from "firebase/firestore";
import type { Player, Match } from "@/lib/definitions";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
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
  photos: z.array(z.string()).max(5),
  aiSummary: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditMatchPage() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = React.useState(false);
  const [isRegeneratingAi, setIsRegeneratingAi] = React.useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [photoUrl, setPhotoUrl] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const matchRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'matches', id);
  }, [firestore, id]);

  const playersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'players'), orderBy('name', 'asc'));
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
      comment: "",
      photos: [],
      aiSummary: null,
    },
  });

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
        comment: match.comment || "",
        photos: match.photos || [],
        aiSummary: match.aiSummary || null,
      });
    }
  }, [match, form]);

  const { control } = form;
  const watchedTeamAPlayerIds = useWatch({ control, name: "teamAPlayerIds" }) || [];
  const watchedTeamBPlayerIds = useWatch({ control, name: "teamBPlayerIds" }) || [];
  const watchedTeamAStats = useWatch({ control, name: "teamAStats" }) || {};
  const watchedTeamBStats = useWatch({ control, name: "teamBStats" }) || {};
  const watchedPhotos = useWatch({ control, name: "photos" }) || [];
  const watchedAiSummary = useWatch({ control, name: "aiSummary" }) || null;

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

  const handleRegenerateAi = async () => {
    setIsRegeneratingAi(true);
    try {
      const teamAPlayers = watchedTeamAPlayerIds.map(id => ({
        name: players.find(p => p.id === id)?.name || '?',
        goals: watchedTeamAStats[id]?.goals || 0
      }));
      const teamBPlayers = watchedTeamBPlayerIds.map(id => ({
        name: players.find(p => p.id === id)?.name || '?',
        goals: watchedTeamBStats[id]?.goals || 0
      }));

      const teamAScore = teamAPlayers.reduce((sum, p) => sum + p.goals, 0);
      const teamBScore = teamBPlayers.reduce((sum, p) => sum + p.goals, 0);

      const aiInput = {
        date: form.getValues('date').toISOString(),
        teamAScore,
        teamBScore,
        teamAPlayers,
        teamBPlayers,
        mvpName: players.find(p => p.id === form.getValues('mvpPlayerId'))?.name,
        bestGoalName: players.find(p => p.id === form.getValues('bestGoalPlayerId'))?.name,
      };

      const result = await generateMatchSummary(aiInput);
      if (result && !('error' in result)) {
        form.setValue('aiSummary', result);
        toast({ title: "Crónica Regenerada", description: "La IA ha escrito una nueva versión." });
      } else {
        toast({ variant: "destructive", title: "Error de IA", description: "No se pudo conectar con la redacción." });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Ocurrió un problema al regenerar." });
    } finally {
      setIsRegeneratingAi(false);
    }
  };

  async function onSubmit(data: FormValues) {
    if (!firestore || !id) return;
    setIsSaving(true);
    
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

    const matchRef = doc(firestore, 'matches', id);
    updateDocumentNonBlocking(matchRef, {
        date: data.date.toISOString(),
        teamAScore,
        teamBScore,
        teamAPlayers,
        teamBPlayers,
        comment: data.comment,
        photos: data.photos,
        aiSummary: data.aiSummary || null,
    });

    toast({ title: "Partido Actualizado", description: "Los cambios se han guardado correctamente." });
    router.push(`/matches/${id}`);
  }

  const addPhoto = () => {
    if (photoUrl && watchedPhotos.length < 5) {
      form.setValue("photos", [...watchedPhotos, photoUrl]);
      setPhotoUrl("");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (watchedPhotos.length >= 5) {
      toast({ variant: "destructive", title: "Límite alcanzado", description: "Máximo 5 fotos por partido." });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        form.setValue("photos", [...watchedPhotos, dataUrl]);
        toast({ title: "Foto Cargada", description: "La imagen local se ha procesado correctamente." });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
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
                      <AvatarImage src={player.avatar || undefined} alt={player.name} />
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

    if (selectedIds.length === 0) return <p className="text-xs text-muted-foreground p-4 italic">Selecciona jugadores para ingresar sus estadísticas.</p>;

    return (
      <div className="space-y-6 pt-4">
        <FormField
          control={form.control}
          name={captainField}
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">¿Quién fue el Capitán?</FormLabel>
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
                      <FormItem key={playerId} className="flex items-center space-x-3 space-y-0 border p-3 rounded-xl hover:bg-accent/50 transition-colors cursor-pointer glass-card">
                        <FormControl><RadioGroupItem value={playerId} /></FormControl>
                        <FormLabel className="font-normal flex items-center gap-2 cursor-pointer w-full">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={player.avatar || undefined} alt={player.name} />
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
          <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Goles Marcados</FormLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedIds.map(playerId => {
              const player = players.find(p => p.id === playerId);
              if (!player) return null;
              return (
                <div key={playerId} className="flex items-center justify-between p-3 border rounded-xl glass-card">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={player.avatar || undefined} alt={player.name} />
                      <AvatarFallback className="text-[10px] font-black">{getInitials(player.name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-bold text-sm">{player.name}</span>
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

  if (playersLoading || matchLoading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!match) return <div className="text-center py-12">Partido no encontrado.</div>;

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href={`/matches/${id}`}><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-3xl font-black italic uppercase tracking-tighter">Editar Encuentro</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
          <Card className="glass-card border-t-4 border-t-yellow-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-yellow-500" />
                Fecha del Partido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className="w-full md:w-[300px] h-12 text-left font-bold rounded-xl border-white/10">
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
            <Accordion type="multiple" className="w-full space-y-4" defaultValue={['team-a', 'team-b']}>
              <AccordionItem value="team-a" className="border rounded-2xl px-4 bg-primary/5 border-primary/10 overflow-hidden">
                <AccordionTrigger className="text-xl font-black uppercase italic text-primary hover:no-underline py-6">Equipo Azul</AccordionTrigger>
                <AccordionContent className="space-y-8 pb-8">
                  {renderPlayerListSelection('A')}
                  {renderTeamStatsEntry('A')}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="team-b" className="border rounded-2xl px-4 bg-accent/5 border-accent/10 overflow-hidden">
                <AccordionTrigger className="text-xl font-black uppercase italic text-accent hover:no-underline py-6">Equipo Rojo</AccordionTrigger>
                <AccordionContent className="space-y-8 pb-8">
                  {renderPlayerListSelection('B')}
                  {renderTeamStatsEntry('B')}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Premios
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="mvpPlayerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">MVP</FormLabel>
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
                      <FormControl><SelectTrigger className="h-12 font-bold"><SelectValue placeholder={scorers.length > 0 ? "Selecciona el mejor gol" : "Sin goleadores"} /></SelectTrigger></FormControl>
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
                Contexto Social
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">La Voz del Administrador</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Escribe el resumen del partido..." className="min-h-[120px] rounded-xl font-medium leading-relaxed" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Galería de Fotos (Máx 5)</FormLabel>
                
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 flex gap-2">
                    <Input 
                      placeholder="Pega la URL de la foto..." 
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      className="h-12 rounded-xl"
                    />
                    <Button type="button" variant="secondary" onClick={addPhoto} disabled={!photoUrl || watchedPhotos.length >= 5} className="h-12 px-6 font-black uppercase italic">
                      URL
                    </Button>
                  </div>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={watchedPhotos.length >= 5}
                      className="h-12 w-full md:w-auto px-6 font-black uppercase italic border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10"
                    >
                      <Upload className="h-4 w-4 mr-2" /> Subir desde Mac
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2">
                  {watchedPhotos.map((url, idx) => {
                    if (!url) return null;
                    return (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-white/10">
                        <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <div className="absolute top-0 left-0 bg-yellow-500 text-black text-[8px] font-black uppercase px-2 py-0.5 rounded-br-lg shadow-lg">
                            Tapa del Diario
                          </div>
                        )}
                        <button 
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="absolute top-1 right-1 bg-destructive p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Crónica de la IA</FormLabel>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRegenerateAi}
                    disabled={isRegeneratingAi}
                    className="h-8 border-primary/20 text-primary hover:bg-primary/10"
                  >
                    {isRegeneratingAi ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Sparkles className="h-3 w-3 mr-2" />}
                    Regenerar Crónica
                  </Button>
                </div>
                {watchedAiSummary ? (
                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <p className="text-xs font-black text-primary italic mb-1">{watchedAiSummary.title}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-3">{watchedAiSummary.summary}</p>
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground italic">Sin crónica generada aún.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 pt-6">
            <Button type="submit" size="lg" className="h-16 px-12 font-black uppercase italic text-lg shadow-xl shadow-primary/30" disabled={isSaving}>
              {isSaving ? (
                <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Guardando...</>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
