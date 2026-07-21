'use client';

import * as React from 'react';
import { useFirestore, useUser, useDoc } from "@/firebase";
import { doc, getDocs, collection, query, where } from "firebase/firestore";
import { getMigrationPreview, runInitialMigration } from "@/lib/seasons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Database, AlertTriangle, CheckCircle2, ShieldAlert, PlayCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from 'next/link';

export default function MigrationPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = React.useState(true);
  const [isMigrating, setIsMigrating] = React.useState(false);
  const [preview, setPreview] = React.useState<{alreadyMigrated: boolean, pendingMatches: number, pendingGallery: number} | null>(null);
  const [result, setResult] = React.useState<any>(null);

  // Diagnostic State
  const [diagLog, setDiagLog] = React.useState<string>("");
  const [isRunningDiag, setIsRunningDiag] = React.useState(false);

  // Form State for initial season
  const [seasonName, setSeasonName] = React.useState("Apertura 2026");
  const [seasonYear, setSeasonYear] = React.useState(2026);
  const [seasonType, setSeasonType] = React.useState<'Apertura' | 'Clausura' | 'Histórico'>("Apertura");
  const [seasonHalf, setSeasonHalf] = React.useState<1 | 2>(1);

  const adminRoleRef = React.useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: adminRole, isLoading: adminLoading } = useDoc<{isAdmin: boolean}>(adminRoleRef);

  React.useEffect(() => {
    async function loadPreview() {
      if (!firestore || adminLoading) return;
      
      if (!adminRole?.isAdmin) {
        setIsLoading(false);
        return;
      }
      
      try {
        const data = await getMigrationPreview(firestore);
        setPreview(data);
      } catch (err: any) {
        console.error("Error loading migration preview:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPreview();
  }, [firestore, adminLoading, adminRole]);

  const runDiagnostic = async () => {
    if (!firestore) return;
    setIsRunningDiag(true);
    let log = `--- INICIO DIAGNÓSTICO [${new Date().toLocaleTimeString()}] ---\n\n`;
    
    try {
      log += "PRUEBA 1: Lectura Simple (getDocs /matches)...\n";
      const snap = await getDocs(collection(firestore, 'matches'));
      log += `✅ ÉXITO. Documentos encontrados: ${snap.size}\n\n`;
    } catch (e: any) {
      log += `❌ FALLÓ PRUEBA 1.\nError: ${e.code}\nMensaje: ${e.message}\n\n`;
    }

    try {
      log += "PRUEBA 2: Query Filtrada (seasonId == 'TEST')...\n";
      const q = query(collection(firestore, 'matches'), where('seasonId', '==', 'TEST'));
      const snap = await getDocs(q);
      log += `✅ ÉXITO. Query permitida.\n\n`;
    } catch (e: any) {
      log += `❌ FALLÓ PRUEBA 2.\nError: ${e.code}\nMensaje: ${e.message}\n\n`;
    }

    log += "--- FIN DIAGNÓSTICO ---";
    setDiagLog(log);
    setIsRunningDiag(false);
  };

  const handleMigrate = async () => {
    if (!firestore || !adminRole?.isAdmin) return;
    setIsMigrating(true);
    try {
      const data = await runInitialMigration(firestore, {
        name: seasonName,
        year: seasonYear,
        type: seasonType,
        half: seasonHalf
      });
      setResult(data);
      toast({ title: "Migración Exitosa", description: "La base de datos ha sido actualizada." });
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
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <div className="text-center">
          <h1 className="text-2xl font-black uppercase italic">Acceso Denegado</h1>
          <p className="text-muted-foreground">Solo administradores pueden acceder.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">Volver al Inicio</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter flex items-center gap-3">
          <Database className="h-10 w-10 text-primary" />
          Administración de Temporadas
        </h1>
      </div>

      <Card className="competition-card border-blue-500/20 bg-blue-500/5">
        <CardHeader>
          <CardTitle className="text-xl font-black italic uppercase flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-blue-500" />
            Diagnóstico Firestore
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runDiagnostic} disabled={isRunningDiag} variant="outline" className="w-full border-blue-500/20 font-bold uppercase italic">
            {isRunningDiag ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
            Ejecutar Prueba de Aislamiento
          </Button>
          {diagLog && (
            <div className="bg-black/40 p-4 rounded-xl border border-white/5">
              <pre className="text-[10px] font-mono whitespace-pre-wrap text-blue-200">{diagLog}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      {!result ? (
        <Card className="competition-card border-orange-500/20 bg-orange-500/5">
          <CardHeader>
            <CardTitle className="text-xl font-black italic uppercase flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Estado de la Migración
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {preview?.alreadyMigrated ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-xl flex items-center gap-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 shrink-0" />
                <p className="text-sm font-bold text-emerald-500 uppercase italic">Base de datos migrada exitosamente.</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Partidos</span>
                    <p className="text-2xl font-bebas">{preview?.pendingMatches}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Galería</span>
                    <p className="text-2xl font-bebas">{preview?.pendingGallery}</p>
                  </div>
                </div>

                <div className="space-y-6 bg-black/20 p-6 rounded-2xl border border-white/5">
                  <h3 className="text-xs font-black uppercase text-primary">Configuración Temporada Inicial</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black">Nombre</Label>
                      <Input value={seasonName} onChange={(e) => setSeasonName(e.target.value)} className="bg-black/40" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black">Año</Label>
                      <Input type="number" value={seasonYear} onChange={(e) => setSeasonYear(parseInt(e.target.value))} className="bg-black/40" />
                    </div>
                  </div>
                </div>

                <Button onClick={handleMigrate} disabled={isMigrating} className="w-full h-16 font-black uppercase italic text-lg">
                  {isMigrating ? <Loader2 className="mr-2 animate-spin h-6 w-6" /> : "Ejecutar Migración Oficial"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="competition-card border-emerald-500/20 bg-emerald-500/5">
          <CardHeader>
            <CardTitle className="text-3xl font-bebas text-emerald-500 italic">MIGRACIÓN COMPLETADA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm italic text-muted-foreground">La arquitectura multi-temporada está activa.</p>
            <Button variant="outline" asChild className="uppercase font-black italic">
              <Link href="/dashboard">VOLVER AL PANEL</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
