'use client';

import * as React from 'react';
import { generateMatchSummary, type MatchSummaryOutput, type MatchSummaryInput } from '@/ai/flows/match-summary-flow';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Quote } from 'lucide-react';

interface MatchAiSummaryProps {
  matchData: MatchSummaryInput;
}

export function MatchAiSummary({ matchData }: MatchAiSummaryProps) {
  const [summary, setSummary] = React.useState<MatchSummaryOutput | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  async function handleGenerate() {
    setIsLoading(true);
    try {
      const result = await generateMatchSummary(matchData);
      setSummary(result);
    } catch (error) {
      console.error('Error generating summary:', error);
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
        {summary ? (
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
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <div className="p-3 bg-primary/10 rounded-full">
                <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1">
                <p className="font-medium text-sm">¿Quieres leer la crónica de este encuentro?</p>
                <p className="text-xs text-muted-foreground">La IA de Real Acade escribirá un resumen basado en las estadísticas.</p>
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
