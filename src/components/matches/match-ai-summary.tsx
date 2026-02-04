
'use client';

import * as React from 'react';
import { generateMatchSummary, type MatchSummaryOutput, type MatchSummaryInput } from '@/ai/flows/match-summary-flow';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Quote, LogIn, AlertCircle, RefreshCw } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import Link from 'next/link';
import type { Match } from '@/lib/definitions';

interface MatchAiSummaryProps {
  matchId: string;
  matchData: MatchSummaryInput;
}

export function MatchAiSummary({ matchId, matchData }: MatchAiSummaryProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const matchRef = useMemoFirebase(() => {
    if (!firestore || !matchId) return null;
    return doc(firestore, 'matches', matchId);
  }, [firestore, matchId]);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: match, isLoading: matchLoading } = useDoc<Match>(matchRef);
  const { data: adminRole } = useDoc<{isAdmin: boolean}>(adminRoleRef);
  const isAdmin = !!adminRole?.isAdmin;

  async function handleGenerate() {
    if (!user || !matchRef) return;
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateMatchSummary(matchData);
      
      if ('error' in result) {
        if (result.error === 'QUOTA_EXCEEDED') {
          setError('Límite de la IA alcanzado. Intenta nuevamente en un minuto.');
        } else {
          setError('La IA de la redacción está ocupada. Reintenta pronto.');
        }
      } else {
        await updateDoc(matchRef, {
          aiSummary: result
        });
      }
    } catch (err: any) {
      setError('Hubo un problema al conectar con la rotativa.');
    } finally {
      setIsGenerating(false);
    }
  }

  if (matchLoading) return <Card className="h-40 animate-pulse bg-primary/5" />;

  const summary = match?.aiSummary;

  return (
    <Card className="border-primary/20 bg-primary/5 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4">
        <Sparkles className="h-12 w-12 text-primary/10" />
      </div>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Crónica de la IA
        </CardTitle>
        <CardDescription>Análisis periodístico oficial.</CardDescription>
      </CardHeader>
      <CardContent>
        {summary ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <h4 className="text-xl font-bold text-primary italic">"{summary.title}"</h4>
            <div className="relative">
              <Quote className="absolute -left-2 -top-2 h-8 w-8 text-primary/10" />
              <p className="text-muted-foreground leading-relaxed italic pl-6">
                {summary.summary}
              </p>
            </div>
            {isAdmin && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleGenerate} 
                disabled={isGenerating}
                className="text-[10px] font-black uppercase tracking-widest text-primary/40 hover:text-primary"
              >
                {isGenerating ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <RefreshCw className="h-3 w-3 mr-2" />}
                Regenerar Versión
              </Button>
            )}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
            <div className="p-3 bg-orange-500/10 rounded-full">
                <AlertCircle className="h-6 w-6 text-orange-500" />
            </div>
            <p className="text-xs text-muted-foreground max-w-[200px]">{error}</p>
            {isAdmin && (
              <Button onClick={handleGenerate} variant="outline" size="sm" className="border-primary/20">
                Reintentar
              </Button>
            )}
          </div>
        ) : !summary && isAdmin ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <div className="p-3 bg-primary/10 rounded-full">
                <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1">
                <p className="font-medium text-sm">¿Generar crónica oficial?</p>
                <p className="text-xs text-muted-foreground">La IA escribirá un resumen que quedará guardado para todos.</p>
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Escribiendo...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generar Ahora
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-2 opacity-40">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
            <p className="text-xs italic">Crónica en redacción...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
