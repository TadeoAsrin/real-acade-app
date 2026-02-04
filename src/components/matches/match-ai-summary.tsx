'use client';

import * as React from 'react';
import { generateMatchSummary, type MatchSummaryOutput, type MatchSummaryInput } from '@/ai/flows/match-summary-flow';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Quote, LogIn, AlertCircle } from 'lucide-react';
import { useUser } from '@/firebase';
import Link from 'next/link';

interface MatchAiSummaryProps {
  matchData: MatchSummaryInput;
}

export function MatchAiSummary({ matchData }: MatchAiSummaryProps) {
  const [summary, setSummary] = React.useState<MatchSummaryOutput | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { user } = useUser();

  async function handleGenerate() {
    if (!user) return;
    setIsLoading(true);
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
        setSummary(result);
      }
    } catch (err: any) {
      setError('Hubo un problema al conectar con la rotativa.');
    } finally {
      setIsLoading(false);
    }
  }

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
        <CardDescription>Análisis periodístico generado por inteligencia artificial.</CardDescription>
      </CardHeader>
      <CardContent>
        {!user ? (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
            <div className="p-3 bg-primary/10 rounded-full">
                <LogIn className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
                <p className="font-medium text-sm text-primary">Función Exclusiva</p>
                <p className="text-xs text-muted-foreground">Inicia sesión para que la IA de Real Acade escriba la crónica de este encuentro.</p>
            </div>
            <Button asChild variant="outline" size="sm" className="border-primary/20 hover:bg-primary/10">
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
          </div>
        ) : summary ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <h4 className="text-xl font-bold text-primary italic">"{summary.title}"</h4>
            <div className="relative">
              <Quote className="absolute -left-2 -top-2 h-8 w-8 text-primary/10" />
              <p className="text-muted-foreground leading-relaxed italic pl-6">
                {summary.summary}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSummary(null)} className="text-xs">
                Generar otra versión
            </Button>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
            <div className="p-3 bg-orange-500/10 rounded-full">
                <AlertCircle className="h-6 w-6 text-orange-500" />
            </div>
            <p className="text-xs text-muted-foreground max-w-[200px]">{error}</p>
            <Button onClick={handleGenerate} variant="outline" size="sm" className="border-primary/20">
              Reintentar
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <div className="p-3 bg-primary/10 rounded-full">
                <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1">
                <p className="font-medium text-sm">¿Quieres leer la crónica de este encuentro?</p>
                <p className="text-xs text-muted-foreground">La IA escribirá un resumen basado en las estadísticas del partido.</p>
            </div>
            <Button onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Escribiendo crónica...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generar Crónica
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
