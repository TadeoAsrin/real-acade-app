
'use client';

import * as React from 'react';
import { useFirestore } from '@/firebase';
import { getMigrationPreview, runInitialMigration } from '@/lib/seasons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Database, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function MigrationPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [migrating, setMigrating] = React.useState(false);
  const [preview, setPreview] = React.useState<any>(null);

  React.useEffect(() => {
    async function load() {
      if (!firestore) return;
      try {
        const data = await getMigrationPreview(firestore);
        setPreview(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [firestore]);

  const handleMigrate = async () => {
    if (!firestore) return;
    setMigrating(true);
    try {
      await runInitialMigration(firestore, {
        name: "Temporada Fundacional",
        year: 2024,
        type: 'Apertura',
        half: 1
      });
      toast({ title: "Migración Exitosa", description: "El club ha entrado en la era de temporadas." });
      const data = await getMigrationPreview(firestore);
      setPreview(data);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setMigrating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-bebas text-xl tracking-widest text-muted-foreground uppercase">Analizando base de datos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8 space-y-8 animate-in fade-in duration-700">
      <div className="space-y-1">
        <h2 className="text-4xl lg:text-7xl font-black uppercase tracking-tighter italic text-white flex items-center gap-4">
          <Database className="h-8 w-8 lg:h-14 lg:w-14 text-primary shrink-0" />
          MIGRACIÓN DE ÉLITE
        </h2>
        <p className="text-[10px] lg:text-xs font-black uppercase tracking-[0.4em] text-primary/60 ml-1">
          ACTUALIZACIÓN ESTRUCTURAL • REAL ACADE
        </p>
      </div>

      <Card className="competition-card border-orange-500/20 bg-orange-500/5">
        <CardHeader>
          <div className="flex items-center gap-4">
            <ShieldAlert className="h-8 w-8 text-orange-500" />
            <div>
              <CardTitle className="text-xl font-bebas tracking-widest uppercase">Zona de Riesgo</CardTitle>
              <CardDescription className="text-xs uppercase font-bold text-orange-500/60">Operación irreversible de base de datos</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Partidos sin Temporada</span>
              <p className="text-3xl font-bebas text-white mt-1">{preview?.pendingMatches || 0}</p>
            </div>
            <div className="p-4 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Elementos de Galería</span>
              <p className="text-3xl font-bebas text-white mt-1">{preview?.pendingGallery || 0}</p>
            </div>
          </div>

          {preview?.alreadyMigrated ? (
            <div className="flex items-center gap-3 p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-xl">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              <p className="text-xs font-bold uppercase text-emerald-500">Este club ya ha sido migrado a la nueva estructura.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Esta acción creará la <strong>Temporada Fundacional (2024)</strong> y asignará automáticamente todos los partidos y fotos existentes a este nuevo ciclo oficial.
              </p>
              <button 
                onClick={handleMigrate} 
                disabled={migrating || (preview?.pendingMatches === 0 && preview?.pendingGallery === 0)}
                className="w-full h-16 bg-primary text-white font-bebas text-2xl tracking-widest shadow-xl shadow-primary/20 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {migrating ? <Loader2 className="h-6 w-6 animate-spin" /> : <Database className="h-6 w-6" />}
                INICIAR MIGRACIÓN OFICIAL
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
