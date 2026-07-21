'use client';

import * as React from 'react';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { 
  getMigrationPreview, 
  runInitialMigration 
} from '@/lib/seasons';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Database, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  ShieldAlert,
  ArrowRight,
  Info
} from 'lucide-react';
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
      toast({
        title: "Migración Exitosa",
        description: `Se han vinculado ${result.matchesMigrated} partidos a ${result.seasonCreated}.`,
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error en la Migración",
        description: error.message || "No se pudo completar el proceso.",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  if (isLoading || roleLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="font-bebas tracking-widest text-muted-foreground uppercase text-sm">Validando Infraestructura...</p>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4 text-center">
        <Card className="max-w-md w-full border-accent/20 bg-accent/5">
          <CardHeader>
            <ShieldAlert className="h-12 w-12 text-accent mx-auto mb-4" />
            <CardTitle className="text-2xl font-bebas tracking-widest text-accent uppercase">Acceso Denegado</CardTitle>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard')}>Volver</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (preview?.alreadyMigrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4 text-center">
        <Card className="max-w-md w-full border-emerald-500/20 bg-emerald-500/5">
          <CardHeader>
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bebas tracking-widest text-emerald-500">MIGRACIÓN COMPLETADA</CardTitle>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => router.push('/dashboard')}>Dashboard</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8 space-y-8 animate-in fade-in duration-700">
      <h1 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter italic flex items-center gap-4 text-white text-center md:text-left">
        <Database className="h-8 w-8 lg:h-12 lg:w-12 text-primary shrink-0" />
        Gestión de Temporadas
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="competition-card border-orange-500/20 bg-orange-500/5">
          <CardHeader>
            <CardTitle className="text-lg font-bebas tracking-widest flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Datos por Vincular
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                <span className="text-3xl font-bebas text-white">{preview?.pendingMatches || 0}</span>
                <p className="text-[8px] font-black uppercase text-muted-foreground mt-1">Partidos</p>
              </div>
              <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                <span className="text-3xl font-bebas text-white">{preview?.pendingGallery || 0}</span>
                <p className="text-[8px] font-black uppercase text-muted-foreground mt-1">Galería</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="competition-card">
          <CardHeader>
            <CardTitle className="text-xl font-bebas tracking-widest">Iniciar Ciclo Inicial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre</Label>
              <Input value={config.name} onChange={(e) => setConfig({...config, name: e.target.value})} className="bg-black/20 border-white/5" />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleMigration} disabled={isMigrating} className="w-full h-14 font-bebas text-xl tracking-widest">
              {isMigrating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Database className="mr-2 h-5 w-5" />}
              Vincular Historial
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
