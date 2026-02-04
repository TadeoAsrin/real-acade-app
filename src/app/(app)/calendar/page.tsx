
'use client';

import * as React from 'react';
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { Match } from "@/lib/definitions";
import { Loader2, Calendar as CalendarIcon, ChevronRight, Flame, Clock } from "lucide-react";
import { format, isSameDay, isFuture, isToday, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function CalendarPage() {
  const firestore = useFirestore();
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const matchesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'matches'), orderBy('date', 'asc'));
  }, [firestore]);

  const { data: matches, isLoading } = useCollection<Match>(matchesQuery);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const allMatches = matches || [];
  
  // Desktop Calendar Logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getDayMatches = (day: Date) => {
    return allMatches.filter(m => isSameDay(parseISO(m.date), day));
  };

  const upcomingMatches = allMatches.filter(m => isFuture(parseISO(m.date)) || isToday(parseISO(m.date)));

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic flex items-center gap-3">
            <CalendarIcon className="h-10 w-10 text-primary" />
            Agenda Real Acade
          </h1>
          <p className="text-muted-foreground">Calendario de partidos y próximos desafíos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Mobile: Agenda View / Desktop: Left Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary px-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Próximos Encuentros
          </h2>
          <div className="space-y-4">
            {upcomingMatches.length > 0 ? upcomingMatches.map(match => {
              const date = parseISO(match.date);
              const isMatchToday = isToday(date);
              
              return (
                <Link key={match.id} href={`/matches/${match.id}`}>
                  <Card className={cn(
                    "glass-card hover:bg-white/5 transition-all group overflow-hidden border-l-4",
                    isMatchToday ? "border-l-orange-500 bg-orange-500/5" : "border-l-primary/30"
                  )}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "flex flex-col items-center justify-center w-12 h-12 rounded-xl font-black italic",
                          isMatchToday ? "bg-orange-500 text-white" : "bg-primary/10 text-primary"
                        )}>
                          <span className="text-xs leading-none">{format(date, "MMM")}</span>
                          <span className="text-lg leading-none">{format(date, "dd")}</span>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm uppercase">{format(date, "eeee", { locale: es })}</span>
                            {isMatchToday && <Badge className="bg-orange-500 h-4 text-[8px] font-black uppercase">¡Hoy!</Badge>}
                          </div>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {format(date, "HH:mm")} HS
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-white transition-colors" />
                    </CardContent>
                  </Card>
                </Link>
              );
            }) : (
              <div className="p-8 border-2 border-dashed rounded-3xl text-center opacity-30">
                <p className="text-xs font-black uppercase italic">Sin partidos programados</p>
              </div>
            )}
          </div>
        </div>

        {/* Desktop: Monthly Calendar */}
        <div className="lg:col-span-8 hidden md:block">
          <Card className="glass-card overflow-hidden">
            <CardHeader className="border-b border-white/5 bg-white/5 p-6 flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-black uppercase italic tracking-tighter">
                {format(currentDate, "MMMM yyyy", { locale: es })}
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline" className="uppercase font-black text-[10px] tracking-widest border-white/10">Vista Mensual</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-7 border-b border-white/5 bg-white/5">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                  <div key={d} className="py-2 text-center text-[10px] font-black uppercase text-muted-foreground/50">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {calendarDays.map((day, i) => {
                  const dayMatches = getDayMatches(day);
                  const isCurrentMonth = isSameDay(startOfMonth(day), startOfMonth(currentDate));
                  const isTodayDay = isToday(day);

                  return (
                    <div key={i} className={cn(
                      "min-h-[100px] p-2 border-r border-b border-white/5 transition-colors",
                      !isCurrentMonth && "bg-black/20 opacity-20",
                      isTodayDay && "bg-primary/5"
                    )}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn(
                          "text-[10px] font-black",
                          isTodayDay ? "text-primary scale-125" : "text-muted-foreground"
                        )}>{format(day, "d")}</span>
                      </div>
                      <div className="space-y-1">
                        {dayMatches.map(m => {
                          const played = m.teamAScore > 0 || m.teamBScore > 0 || !isFuture(parseISO(m.date));
                          return (
                            <Link key={m.id} href={`/matches/${m.id}`}>
                              <div className={cn(
                                "text-[8px] font-black uppercase p-1 rounded border leading-tight truncate",
                                played ? "bg-white/5 border-white/10 text-muted-foreground" : "bg-primary border-primary text-white"
                              )}>
                                {played ? `Final: ${m.teamAScore}-${m.teamBScore}` : `${format(parseISO(m.date), "HH:mm")} Match`}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
