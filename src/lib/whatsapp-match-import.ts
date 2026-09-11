import type { Player, Season } from '@/lib/definitions';

export type ImportedTeam = 'A' | 'B';

export type ParsedWhatsAppPlayer = {
  sourceName: string;
  team: ImportedTeam;
  goals: number;
  isCaptain: boolean;
};

export type ParsedWhatsAppMatch = {
  venue: string | null;
  date: string | null;
  matchNumber: number | null;
  seasonType: 'Apertura' | 'Clausura' | null;
  seasonYear: number | null;
  players: ParsedWhatsAppPlayer[];
  mvpName: string | null;
  bestGoalName: string | null;
  warnings: string[];
};

export type PlayerResolution = {
  sourceName: string;
  playerId: string | null;
  status: 'matched' | 'unresolved' | 'ambiguous';
  candidates: Player[];
};

const INVISIBLE = /[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g;
const VARIATION_SELECTORS = /[\uFE0E\uFE0F]/g;

// Real Acade can use different visual markers for pan-y-queso without forcing
// everyone to type the same emoji every week. Keep this list explicit: color is
// not a reliable Unicode property, so unknown symbols are never guessed.
const DEFAULT_BLUE_MARKERS = ['🔵', '💙', '🟦'];
const DEFAULT_RED_MARKERS = ['🔴', '❤️', '❤', '🟥', '🔺'];

function normalizeMarker(value: string): string {
  return value.replace(VARIATION_SELECTORS, '').trim();
}

function uniqueMarkers(markers: string[]): string[] {
  return [...new Set(markers.map(normalizeMarker).filter(Boolean))];
}

/**
 * Learns the markers declared by a score line such as:
 *   Azul 7 💙 - Rojo 3 ❤️
 * This lets a message introduce a new symbol without changing the parser.
 */
function inferTeamMarkers(text: string): { blue: string[]; red: string[] } {
  const scoreLine = text.match(/\bAzul\s+\d+\s*([^\w\s-]+)\s*[-–—]\s*Rojo\s+\d+\s*([^\w\s-]+)/iu);
  return {
    blue: uniqueMarkers([...DEFAULT_BLUE_MARKERS, scoreLine?.[1] ?? '']),
    red: uniqueMarkers([...DEFAULT_RED_MARKERS, scoreLine?.[2] ?? '']),
  };
}

function bodyHasMarker(body: string, markers: string[]): boolean {
  const normalized = normalizeMarker(body);
  return markers.some(marker => normalized.includes(marker));
}

function removeMarkers(value: string, markers: string[]): string {
  let result = normalizeMarker(value);
  for (const marker of markers) result = result.split(marker).join('');
  return result;
}

export function normalizePersonName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(INVISIBLE, '')
    .replace(/[“”"'`´]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function cleanSourceName(value: string, teamMarkers: string[] = [...DEFAULT_BLUE_MARKERS, ...DEFAULT_RED_MARKERS]): string {
  return removeMarkers(value.replace(INVISIBLE, ''), teamMarkers)
    .replace(/⚽[\uFE0E\uFE0F]?/g, '')
    .replace(/[“”"']?\s*\bC\b\s*[“”"']?/gi, '')
    .replace(/^[\s.\-–—]+|[\s.\-–—]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseWhatsAppMatch(message: string): ParsedWhatsAppMatch {
  const text = message.replace(/\r/g, '').replace(INVISIBLE, ' ');
  const compact = text.replace(/\s+/g, ' ').trim();
  const warnings: string[] = [];
  const markers = inferTeamMarkers(compact);
  const allTeamMarkers = uniqueMarkers([...markers.blue, ...markers.red]);

  const venueMatch = compact.match(/🏟[\uFE0E\uFE0F]?\s*(.+?)(?=\s*🗓|\s+\d{1,2}\/\d{1,2}\/\d{4})/u);
  const dateMatch = compact.match(/(?:🗓[\uFE0E\uFE0F]?\s*)?(\d{1,2})\/(\d{1,2})\/(\d{4})/u);
  const roundMatch = compact.match(/\bFecha\s+(\d+)\b/i);
  const seasonMatch = compact.match(/\b(?:Torneo\s+)?(Apertura|Clausura)\s+(\d{4})\b/i);

  let date: string | null = null;
  if (dateMatch) {
    const [, day, month, year] = dateMatch;
    date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  } else warnings.push('No se encontró una fecha válida.');

  const playerStart = compact.search(/\b1\s*[.)]/);
  const playerEndCandidates = [compact.search(/\bMvp\s*:/i), compact.search(/\bMejor\s+gol\s*:/i)]
    .filter(index => index >= 0);
  const playerEnd = playerEndCandidates.length ? Math.min(...playerEndCandidates) : compact.length;
  const rosterText = playerStart >= 0 ? compact.slice(playerStart, playerEnd) : '';
  const entryRegex = /(?:^|\s)(\d{1,2})\s*[.)]\s*(.*?)(?=(?:\s+\d{1,2}\s*[.)]\s*)|$)/gu;
  const players: ParsedWhatsAppPlayer[] = [];
  let entry: RegExpExecArray | null;

  while ((entry = entryRegex.exec(rosterText)) !== null) {
    const body = entry[2].trim();
    const hasBlue = bodyHasMarker(body, markers.blue);
    const hasRed = bodyHasMarker(body, markers.red);
    if (hasBlue === hasRed) {
      warnings.push(`No se pudo determinar el equipo de “${cleanSourceName(body, allTeamMarkers) || body}”.`);
      continue;
    }
    const sourceName = cleanSourceName(body, allTeamMarkers);
    if (!sourceName) continue;
    const bodyWithoutTeam = removeMarkers(body, allTeamMarkers);
    players.push({
      sourceName,
      team: hasBlue ? 'A' : 'B',
      goals: (body.match(/⚽/g) || []).length,
      isCaptain: /[“”"']?\s*\bC\b\s*[“”"']?/i.test(bodyWithoutTeam),
    });
  }
  if (!players.length) warnings.push('No se encontraron jugadores numerados con un marcador de equipo reconocido.');

  const mvpMatch = compact.match(/\bMvp\s*:\s*(.+?)(?=\s+Mejor\s+gol\s*:|$)/i);
  const bestGoalMatch = compact.match(/\bMejor\s+gol\s*:\s*(.+?)$/i);

  return {
    venue: venueMatch?.[1]?.trim() || null,
    date,
    matchNumber: roundMatch ? Number(roundMatch[1]) : null,
    seasonType: seasonMatch ? (seasonMatch[1][0].toUpperCase() + seasonMatch[1].slice(1).toLowerCase()) as 'Apertura' | 'Clausura' : null,
    seasonYear: seasonMatch ? Number(seasonMatch[2]) : null,
    players,
    mvpName: mvpMatch?.[1]?.trim() || null,
    bestGoalName: bestGoalMatch?.[1]?.trim() || null,
    warnings,
  };
}

export function resolvePlayerName(sourceName: string, players: Player[]): PlayerResolution {
  const normalized = normalizePersonName(sourceName);
  const candidates = players.filter(player => normalizePersonName(player.name) === normalized);
  if (candidates.length === 1) {
    return { sourceName, playerId: candidates[0].id, status: 'matched', candidates };
  }
  return {
    sourceName,
    playerId: null,
    status: candidates.length > 1 ? 'ambiguous' : 'unresolved',
    candidates,
  };
}

export function findImportedSeason(parsed: ParsedWhatsAppMatch, seasons: Season[]): Season | null {
  if (!parsed.seasonType || !parsed.seasonYear) return null;
  const matches = seasons.filter(season => season.type === parsed.seasonType && season.year === parsed.seasonYear);
  return matches.length === 1 ? matches[0] : null;
}

export function sameImportedName(a: string | null, b: string): boolean {
  return !!a && normalizePersonName(a) === normalizePersonName(b);
}
