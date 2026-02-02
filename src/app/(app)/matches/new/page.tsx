
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

const playerStatsSchema = z.object({
  goals: z.coerce.number().min(0).default(0),
  assists: z.coerce.number().min(0).default(0),
  fouls: z.coerce.number().min(0).default(0),
});

const formSchema = z.object({
  date: z.date({
    required_error: "Se requiere una fecha para el partido.",
  }),
  teamAStats: z.record(playerStatsSchema),
  teamBStats: z.record(playerStatsSchema),
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

  const defaultValues = {
    teamAStats: Object.fromEntries(
      teamAPlayers.map((p) => [p.id, { goals: 0, assists: 0, fouls: 0 }])
    ),
    teamBStats: Object.fromEntries(
      teamBPlayers.map((p) => [p.id, { goals: 0, assists: 0, fouls: 0 }])
    ),
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

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

  const renderPlayerFields = (team: "A" | "B") => {
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
              <FormItem className="w-20">
                <FormLabel>Goles</FormLabel>
                <FormControl>
                  <Input type="number" min="0" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${teamKey}.${player.id}.assists`}
            render={({ field }) => (
              <FormItem className="w-20">
                <FormLabel>Asist.</FormLabel>
                <FormControl>
                  <Input type="number" min="0" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${teamKey}.${player.id}.fouls`}
            render={({ field }) => (
              <FormItem className="w-20">
                <FormLabel>Faltas</FormLabel>
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
                            format(field.value, "PPP")
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
                <AccordionContent className="space-y-4">
                  {renderPlayerFields("A")}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="team-b">
                <AccordionTrigger className="text-xl font-semibold text-accent">
                  Resto del Mundo
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  {renderPlayerFields("B")}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
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
