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
  title: z.string().describe('Un título creativo para la crónica del partido.'),
  summary: z.string().describe('Una crónica divertida, emocionante y profesional del partido en español (máximo 150 palabras).'),
});

export type MatchSummaryOutput = z.infer<typeof MatchSummaryOutputSchema>;

const matchSummaryPrompt = ai.definePrompt({
  name: 'matchSummaryPrompt',
  input: { schema: MatchSummaryInputSchema },
  output: { schema: MatchSummaryOutputSchema },
  prompt: `Eres un apasionado periodista deportivo del club "Real Acade". Tu misión es escribir una crónica emocionante, divertida y un poco dramática de un partido de Fútbol 7.

Detalles del partido:
- Fecha: {{{date}}}
- Resultado: Azul {{{teamAScore}}} - {{{teamBScore}}} Rojo
- Jugadores Equipo Azul y sus goles:
{{#each teamAPlayers}}  * {{{this.name}}}: {{{this.goals}}} goles
{{/each}}
- Jugadores Equipo Rojo y sus goles:
{{#each teamBPlayers}}  * {{{this.name}}}: {{{this.goals}}} goles
{{/each}}
- MVP del partido: {{{mvpName}}}
- Autor del mejor gol: {{{bestGoalName}}}

Escribe la crónica en español, destacando a los goleadores y premiados. Usa un lenguaje futbolero clásico (ej. "el esférico", "romper las redes", "clase magistral").`,
});

export async function generateMatchSummary(input: MatchSummaryInput): Promise<MatchSummaryOutput> {
  const { output } = await matchSummaryPrompt(input);
  if (!output) throw new Error('Failed to generate match summary');
  return output;
}
