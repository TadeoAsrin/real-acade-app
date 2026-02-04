'use server';
/**
 * @fileOverview Flow to generate a fun and creative summary of a football match.
 *
 * - generateMatchSummary - Function that handles the summary generation.
 * - MatchSummaryInput - The input type for the summary.
 * - MatchSummaryOutput - The return type for the summary.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MatchSummaryInputSchema = z.object({
  date: z.string(),
  teamAScore: z.number(),
  teamBScore: z.number(),
  teamAPlayers: z.array(z.object({
    name: z.string(),
    goals: z.number(),
  })),
  teamBPlayers: z.array(z.object({
    name: z.string(),
    goals: z.number(),
  })),
  mvpName: z.string().optional(),
  bestGoalName: z.string().optional(),
});

export type MatchSummaryInput = z.infer<typeof MatchSummaryInputSchema>;

const MatchSummaryOutputSchema = z.object({
  title: z.string().describe('Un título corto, impactante y profesional (estilo titular de diario).'),
  subtitle: z.string().describe('Una frase corta que resuma lo más importante del encuentro.'),
  summary: z.string().describe('Una crónica apasionada y profesional en español (máximo 120 palabras). Usa lenguaje futbolístico de élite.'),
});

export type MatchSummaryOutput = z.infer<typeof MatchSummaryOutputSchema>;

const matchSummaryPrompt = ai.definePrompt({
  name: 'matchSummaryPrompt',
  input: { schema: MatchSummaryInputSchema },
  output: { schema: MatchSummaryOutputSchema },
  prompt: `Eres el editor jefe de "La Gaceta de Real Acade", un prestigioso diario deportivo. Tu misión es escribir la noticia principal del último partido.

Detalles del partido:
- Fecha: {{{date}}}
- Resultado: Azul {{{teamAScore}}} - {{{teamBScore}}} Rojo
- Goleadores Azul:
{{#each teamAPlayers}}{{#if this.goals}}  * {{{this.name}}}: {{{this.goals}}} goles
{{/if}}{{/each}}
- Goleadores Rojo:
{{#each teamBPlayers}}{{#if this.goals}}  * {{{this.name}}}: {{{this.goals}}} goles
{{/if}}{{/each}}
- MVP: {{{mvpName}}}
- Mejor Gol: {{{bestGoalName}}}

Escribe como un cronista de élite. El titular debe ser potente. El subtítulo debe enganchar. La crónica debe destacar la épica, el esfuerzo y los nombres propios. Usa términos como "asedio", "testarazo", "clase magistral", "el fondo de las mallas".`,
});

export async function generateMatchSummary(input: MatchSummaryInput): Promise<MatchSummaryOutput> {
  const { output } = await matchSummaryPrompt(input);
  if (!output) throw new Error('Failed to generate match summary');
  return output;
}
