'use client';

import * as React from 'react';
import { useSeason } from '@/context/season-context';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { createNewSeason } from '@/lib/seasons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CalendarDays, Plus, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function SeasonManagementPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const { seasons, activeSeasonId, loading: seasonLoading } = useSeason();

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);
  
  const { data: adminRole } = useDoc<{isAdmin: boolean}>(adminRoleRef);
  const isAdmin = adminRole?.isAdmin || user?.email === 'tadeoasrin@gmail.com';

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    year: new Date().getFullYear(),
    type: 'Apertura' as 'Apertura' | 'Clausura',
    half: 1 as 1 | 2,
    startDate: new Date().toISOString().split('T')[0]
  });

  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !isAdmin) return;

    const alreadyExists = seasons.some(s => s.year === formData.year && s.half === formData.half);
    if (alreadyExists) {
      toast({
        variant: "destructive",
        title: "Temporada Duplicada",
        description: `Ya existe una temporada registrada para ${formData.year} - Semestre ${formData.half}.`
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createNewSeason(firestore, {
        name: formData.name || `${formData.type} ${formData.year}`,
        year: formData.year,
        type: formData.type,
        half: formData.half,
        startDate: new Date(formData.startDate).toISOString()
      });

      toast({
        title: "Nueva Temporada Creada",
        description: `"${formData.name || `${formData.type} ${formData.year}`}" es ahora la temporada activa.`
      });

      setFormData({
        name: '',
        year: new Date().getFullYear(),
        type: 'Apertura',
        half: 1,
        startDate: new Date().toISOString().split('T')[0]
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdmin && !seasonLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bebas tracking-widest uppercase">Acceso Denegado</h2>
        <p className="text-muted-foreground text-sm max-w-md uppercase font-bold">Solo los administradores pueden gestionar las temporadas.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8 space-y-8 animate-in fade-in duration-700">
      <div className="space-y-1">
        <h2 className="text-4xl lg:text-7xl font-black uppercase tracking-tighter italic text-white flex items-center gap-4">
          <ShieldCheck className="h-8 w-8 lg:h-14 lg:w-14 text-primary shrink-0" />
          GESTIÓN DE CLUB
        </h2>
        <p className="text-[10px] lg:text-xs font-black uppercase tracking-[0.4em] text-primary/60 ml-1">
          CONTROL DE TEMPORADAS • REAL ACADE
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <Card className="competition-card border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-2xl font-bebas tracking-widest uppercase">Nueva Temporada</CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold text-primary/60">Abrir un nuevo ciclo oficial</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSeason} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre (Opcional)</Label>
                  <Input 
                    placeholder="Ej: Clausura 2026" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="bg-black/40 border-white/10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Año</Label>
                    <Input 
                      type="number" 
                      value={isNaN(formData.year) ? '' : formData.year} 
                      onChange={e => {
                        const val = parseInt(e.target.value);
                        setFormData({...formData, year: isNaN(val) ? 0 : val});
                      }}
                      className="bg-black/40 border-white/10 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Semestre</Label>
                    <Select 
                      value={formData.half.toString()} 
                      onValueChange={val => setFormData({...formData, half: (parseInt(val) || 1) as 1 | 2})}
                    >
                      <SelectTrigger className="bg-black/40 border-white/10 font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/10">
                        <SelectItem value="1">1er Semestre</SelectItem>
                        <SelectItem value="2">2do Semestre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tipo de Torneo</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={val => setFormData({...formData, type: val as 'Apertura' | 'Clausura'})}
                  >
                    <SelectTrigger className="bg-black/40 border-white/10 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                      <SelectItem value="Apertura">APERTURA</SelectItem>
                      <SelectItem value="Clausura">CLAUSURA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fecha de Inicio</Label>
                  <Input 
                    type="date" 
                    value={formData.startDate} 
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                    className="bg-black/40 border-white/10"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full h-14 bg-primary text-white font-bebas text-xl tracking-widest shadow-xl shadow-primary/20 mt-4"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
                  CREAR Y ACTIVAR TEMPORADA
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <Card className="competition-card border-white/5 bg-black/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bebas tracking-widest uppercase">Historial del Club</CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground/60">Ciclos registrados en Real Acade</CardDescription>
              </div>
              <CalendarDays className="h-8 w-8 text-muted-foreground/20" />
            </CardHeader>
            <CardContent className="space-y-4">
              {seasons.map((season) => {
                const isActive = season.id === activeSeasonId;
                return (
                  <div 
                    key={season.id} 
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border transition-all",
                      isActive 
                        ? "bg-primary/10 border-primary/40 shadow-lg shadow-primary/5" 
                        : "bg-white/5 border-white/5 opacity-60 hover:opacity-100"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-12 w-12 rounded-lg flex items-center justify-center font-bebas text-2xl",
                        isActive ? "bg-primary text-white" : "bg-white/10 text-muted-foreground"
                      )}>
                        {season.half}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm uppercase tracking-tight text-white">{season.name}</h4>
                          {isActive && (
                            <Badge className="bg-primary/20 text-primary border-none text-[8px] px-1.5 py-0">ACTIVA</Badge>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                          {season.year} • {season.type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {isActive ? (
                        <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />
                      ) : (
                        <span className="text-[8px] font-black uppercase text-muted-foreground/20">PASADA</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {seasons.length === 0 && (
                <div className="py-20 text-center opacity-20">
                  <CalendarDays className="h-12 w-12 mx-auto mb-4" />
                  <p className="font-bebas text-xl tracking-widest uppercase">Sin temporadas registradas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
