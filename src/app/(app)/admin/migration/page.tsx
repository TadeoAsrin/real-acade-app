'use client';

import * as React from 'react';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { getMigrationPreview, runInitialMigration } from '@/lib/seasons';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Database, AlertTriangle, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function MigrationPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const [preview, setPreview] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isMigrating, setIsMigrating] = React.useState(false);
  
  const [config, setConfig] = React.useState({
    name: "Temporada Fundacional",
    year: 2026,
    type: "Apertura" as const,
    half: 1 as const
  });

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: adminRole, isLoading: roleLoading } = useDoc<{isAdmin: boolean}>(adminRoleRef);
  const hasAccess = adminRole?.isAdmin || user?.email === 'tadeoasrin@gmail.com';

  React.useEffect(() => {
    async function loadPreview() {
      if (!firestore) return;
      try {
        const data = await getMigrationPreview(firestore);
        setPreview(data);
      } catch (error) {
        console.error("Error loading preview:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadPreview();
  }, [firestore]);

  const handleMigration = async () => {
    if (!firestore) return;
    setIsMigrating(true);
    try {
      const result = await runInitialMigration(firestore, config);
      toast({ title: "Migración Exitosa", description: `Se han vinculado ${result.matchesMigrated} partidos.` });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsMigrating(false);
    }
  };

  if (isLoading || roleLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" /></div>;
  if (!hasAccess) return <div className="p-20 text-center uppercase font-bebas text-2xl tracking-widest text-accent">Acceso Denegado</div>;

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8 animate-in fade-in">
      <h1 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter italic flex items-center gap-4 text-white">
        <Database className="h-12 w-12 text-primary" />
        Gestión de Temporadas
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="competition-card border-orange-500/20 bg-orange-500/5">
          <CardHeader><CardTitle className="text-lg font-bebas tracking-widest">Datos Pendientes</CardTitle></CardHeader>
          <CardContent>
             <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-black/40 rounded-xl">
                 <span className="text-3xl font-bebas">{preview?.pendingMatches || 0}</span>
                 <p className="text-[8px] uppercase font-black text-muted-foreground">Partidos</p>
               </div>
               <div className="p-4 bg-black/40 rounded-xl">
                 <span className="text-3xl font-bebas">{preview?.pendingGallery || 0}</span>
                 <p className="text-[8px] uppercase font-black text-muted-foreground">Galería</p>
               </div>
             </div>
          </CardContent>
        </Card>
        <Card className="competition-card">
          <CardHeader><CardTitle className="font-bebas text-xl">Iniciar Ciclo Inicial</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
               <div className="space-y-1">
                 <Label className="text-[8px] font-black uppercase tracking-widest">Nombre Temporada</Label>
                 <Input value={config.name} onChange={(e) => setConfig({...config, name: e.target.value})} className="bg-black/40" />
               </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleMigration} disabled={isMigrating} className="w-full h-14 font-bebas text-xl tracking-widest">
              {isMigrating ? <Loader2 className="animate-spin mr-2" /> : <Database className="mr-2" />}
              Vincular Historial
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
