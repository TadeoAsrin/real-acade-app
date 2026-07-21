'use client';

import * as React from 'react';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { runInitialMigration, getMigrationPreview } from '@/lib/seasons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Database, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';

/**
 * Panel de Migración de Base de Datos (Versión Consolidada).
 * Permite inicializar el sistema de temporadas en una base de datos existente.
 */
export default function MigrationPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [config, setConfig] = React.useState({
    name: "Temporada Inaugural",
    year: new Date().getFullYear(),
    type: "Apertura" as const,
    half: 1 as const
  });
  
  const [isPreviewLoading, setIsPreviewLoading] = React.useState(true);
  const [preview, setPreview] = React.useState<any>(null);
  const [isMigrating, setIsMigrating] = React.useState(false);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: adminRole } = useDoc<{isAdmin: boolean}>(adminRoleRef);
  const isAdmin = adminRole?.isAdmin || user?.email === 'tadeoasrin@gmail.com';

  React.useEffect(() => {
    async function loadPreview() {
      if (!firestore) return;
      try {
        const data = await getMigrationPreview(firestore);
        setPreview(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsPreviewLoading(false);
      }
    }
    loadPreview();
  }, [firestore]);

  const handleMigrate = async () => {
    if (!firestore || !isAdmin) return;
    setIsMigrating(true);
    try {
      const result = await runInitialMigration(firestore, config);
      toast({ title: "Migración Exitosa", description: `Se migraron ${result.matchesMigrated} partidos y ${result.galleryMigrated} items.` });
      const data = await getMigrationPreview(firestore);
      setPreview(data);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error de Migración", description: error.message });
    } finally {
      setIsMigrating(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md border-destructive/20 bg-destructive/5">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle className="text-destructive">Acceso Restringido</CardTitle>
            <CardDescription>Solo los administradores de nivel élite pueden acceder a las herramientas de base de datos.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8 space-y-8 animate-in fade-in duration-700">
      <div className="space-y-1">
        <h2 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter italic text-white flex items-center gap-4">
          <Database className="h-8 w-8 lg:h-12 lg:w-12 text-primary shrink-0" />
          SISTEMA DE MIGRACIÓN
        </h2>
        <p className="text-[10px] lg:text-xs font-black uppercase tracking-[0.4em] text-primary/60 ml-1">
          CONFIGURACIÓN DE TEMPORADAS • NIVEL DATA-MASTER
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-2 competition-card border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="font-bebas tracking-widest text-2xl">CONFIGURAR TEMPORADA 0</CardTitle>
            <CardDescription className="text-xs uppercase font-bold text-muted-foreground/60">Define el punto de partida histórico</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Nombre de Temporada</Label>
                <Input value={config.name} onChange={e => setConfig({...config, name: e.target.value})} className="bg-black/40 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Año Oficial</Label>
                <Input type="number" value={config.year} onChange={e => setConfig({...config, year: parseInt(e.target.value)})} className="bg-black/40 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Tipo de Torneo</Label>
                <Select value={config.type} onValueChange={(val: any) => setConfig({...config, type: val})}>
                  <SelectTrigger className="bg-black/40 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Apertura">Apertura</SelectItem>
                    <SelectItem value="Clausura">Clausura</SelectItem>
                    <SelectItem value="Histórico">Histórico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="pt-6 border-t border-white/5">
              <Button 
                onClick={handleMigrate} 
                disabled={isMigrating || preview?.alreadyMigrated} 
                className="w-full h-14 font-bebas text-xl tracking-widest shadow-lg shadow-primary/20"
              >
                {isMigrating ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <ShieldCheck className="h-5 w-5 mr-2" />}
                {preview?.alreadyMigrated ? "BASE DE DATOS YA MIGRADA" : "INICIAR MIGRACIÓN ATÓMICA"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="competition-card border-white/5 bg-black/40">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest">Estado Actual</CardTitle>
            </CardHeader>
            <CardContent>
              {isPreviewLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : preview?.alreadyMigrated ? (
                <div className="space-y-4 text-center">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-emerald-500 uppercase">Sistema Operativo</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-[10px] font-black text-muted-foreground uppercase">Partidos Huérfanos</span>
                    <span className="text-lg font-bebas text-primary">{preview?.pendingMatches}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-[10px] font-black text-muted-foreground uppercase">Galería Huérfana</span>
                    <span className="text-lg font-bebas text-primary">{preview?.pendingGallery}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
