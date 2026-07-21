
'use client';

import * as React from 'react';
import { useFirestore, useUser, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { getMigrationPreview, runInitialMigration } from "@/lib/seasons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Database, AlertTriangle, CheckCircle2, ChevronRight, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function MigrationPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = React.useState(true);
  const [isMigrating, setIsMigrating] = React.useState(false);
  const [preview, setPreview] = React.useState<{alreadyMigrated: boolean, pendingMatches: number, pendingGallery: number} | null>(null);
  const [result, setResult] = React.useState<any>(null);

  const adminRoleRef = React.useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: adminRole, isLoading: adminLoading } = useDoc<{isAdmin: boolean}>(adminRoleRef);

  React.useEffect(() => {
    async function loadPreview() {
      if (!firestore) return;
      try {
        const data = await getMigrationPreview(firestore);
        setPreview(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPreview();
  }, [firestore]);

  const handleMigrate = async () => {
    if (!firestore) return;
    setIsMigrating(true);
    try {
      const data = await runInitialMigration(firestore);
      setResult(data);
      toast({ title: "Migración Exitosa", description: "La base de datos ha sido actualizada a Temporadas." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error en Migración", description: err.message });
    } finally {
      setIsMigrating(false);
    }
  };

  if (adminLoading || isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  }

  if (!adminRole?.isAdmin) {
    return <div className="text-center py-20 italic">Acceso denegado. Solo administradores.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter flex items-center gap-3">
          <Database className="h-10 w-10 text-primary" />
          Migración de Datos: Temporadas
        </h1>
        <p className="text-muted-foreground">Prepara la base de datos oficial para el soporte multi-temporada de Real Acade.</p>
      </div>

      {!result ? (
        <Card className="competition-card border-orange-500/20 bg-orange-500/5">
          <CardHeader>
            <CardTitle className="text-xl font-black italic uppercase flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Estado de la Base de Datos
            </CardTitle>
            <CardDescription>Análisis de documentos huérfanos sin temporada asociada.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {preview?.alreadyMigrated ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-xl flex items-center gap-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 shrink-0" />
                <div>
                  <h3 className="font-bold text-emerald-500 uppercase italic">Migración Completada</h3>
                  <p className="text-sm text-muted-foreground">La infraestructura ya cuenta con el activo de temporadas. No se requieren más acciones.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Partidos a Migrar</span>
                    <Badge variant="outline" className="text-xl font-bebas tracking-widest">{preview?.pendingMatches}</Badge>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Fotos/Videos a Migrar</span>
                    <Badge variant="outline" className="text-xl font-bebas tracking-widest">{preview?.pendingGallery}</Badge>
                  </div>
                </div>

                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex gap-3">
                  <Info className="h-5 w-5 text-primary shrink-0" />
                  <div className="text-xs leading-relaxed">
                    <p className="font-bold text-primary uppercase mb-1">Acción Planificada:</p>
                    <ul className="space-y-1 list-disc pl-4 text-muted-foreground">
                      <li>Se creará la <span className="text-white font-bold italic">"Temporada Fundacional"</span> (2024 Apertura).</li>
                      <li>Se asignará el ID de esta temporada a todos los documentos mostrados arriba.</li>
                      <li>Se marcará <span className="text-white font-bold italic">activeSeasonId</span> como el puntero oficial.</li>
                    </ul>
                  </div>
                </div>

                <Button 
                  onClick={handleMigrate} 
                  disabled={isMigrating || (preview?.pendingMatches === 0 && preview?.pendingGallery === 0)}
                  className="w-full h-16 font-black uppercase italic text-lg shadow-xl shadow-primary/20"
                >
                  {isMigrating ? <Loader2 className="mr-2 animate-spin h-6 w-6" /> : "Ejecutar Migración de Datos"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="competition-card border-emerald-500/20 bg-emerald-500/5 animate-in zoom-in-95 duration-500">
          <CardHeader>
            <CardTitle className="text-3xl font-bebas tracking-widest text-emerald-500 flex items-center gap-3 italic">
              <CheckCircle2 className="h-8 w-8" />
              INFORME DE MIGRACIÓN EXITOSA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Temporada Creada</span>
                <span className="text-2xl font-black italic text-white leading-none uppercase">{result.seasonCreated}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Partidos Vinculados</span>
                <span className="text-4xl font-bebas text-emerald-500 leading-none">{result.matchesMigrated}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Galería Actualizada</span>
                <span className="text-4xl font-bebas text-emerald-500 leading-none">{result.galleryMigrated}</span>
              </div>
            </div>

            <div className="h-px bg-white/5 w-full" />
            
            <div className="flex flex-col items-center gap-4">
              <p className="text-center text-sm italic text-muted-foreground">La arquitectura multi-temporada ya es la base oficial de Real Acade. Próximo paso: Refactorizar consultas.</p>
              <Button variant="outline" asChild className="border-white/10 uppercase font-black italic">
                <a href="/dashboard">VOLVER AL PANEL</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
