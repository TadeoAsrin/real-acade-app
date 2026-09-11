import type { Match, Player } from '../definitions';

export type ColdFormEntry = {
  playerId: string;
  playerName: string;
  appearances: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  pointsPerGame: number;
  losingStreak: number;
  score: number;
  eligible: boolean;
  reason: string;
  recentMatchIds: string[];
};

const compareId = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

export function auditColdForm(players: Player[], matches: Match[], seasonId: string): ColdFormEntry[] {
  const played = matches
    .filter(match => match.seasonId === seasonId && (match.teamAScore > 0 || match.teamBScore > 0))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || (a.matchNumber ?? 0) - (b.matchNumber ?? 0) || compareId(a.id, b.id));

  return [...players]
    .sort((a, b) => compareId(a.id, b.id))
    .map(player => {
      const appearances = played.flatMap(match => {
        const inA = match.teamAPlayers.some(entry => entry.playerId === player.id);
        const inB = !inA && match.teamBPlayers.some(entry => entry.playerId === player.id);
        if (!inA && !inB) return [];
        const own = inA ? match.teamAScore : match.teamBScore;
        const other = inA ? match.teamBScore : match.teamAScore;
        const result = own === other ? 'D' : own > other ? 'W' : 'L';
        return [{ id: match.id, result }];
      });

      const recent = appearances.slice(-5);
      const wins = recent.filter(item => item.result === 'W').length;
      const draws = recent.filter(item => item.result === 'D').length;
      const losses = recent.filter(item => item.result === 'L').length;
      const points = wins * 3 + draws;
      const pointsPerGame = recent.length ? Math.round((points / recent.length) * 100) / 100 : 0;

      let losingStreak = 0;
      for (const item of [...appearances].reverse()) {
        if (item.result !== 'L') break;
        losingStreak++;
      }

      const enoughSample = recent.length >= 3;
      const zeroPoints = enoughSample && points === 0;
      const hardStreak = losingStreak >= 3;
      const poorRecentForm = enoughSample && losses >= 3 && pointsPerGame <= 1;
      const eligible = enoughSample && (zeroPoints || hardStreak || poorRecentForm);

      const score = eligible
        ? Math.round((
            losses * 10
            + losingStreak * 20
            + (zeroPoints ? 50 : 0)
            + Math.max(0, 1 - pointsPerGame) * 40
          ) * 100) / 100
        : 0;

      let reason = 'Fuera: necesita al menos 3 apariciones recientes.';
      if (enoughSample && zeroPoints) reason = `Entra: 0 puntos en ${recent.length} partidos.`;
      else if (enoughSample && hardStreak) reason = `Entra: ${losingStreak} derrotas consecutivas.`;
      else if (enoughSample && poorRecentForm) reason = `Entra: ${losses} derrotas y ${points} puntos en ${recent.length} partidos.`;
      else if (enoughSample) reason = `Fuera: ${points} puntos en ${recent.length} partidos; no supera el umbral negativo.`;

      return {
        playerId: player.id,
        playerName: player.name,
        appearances: recent.length,
        wins,
        draws,
        losses,
        points,
        pointsPerGame,
        losingStreak,
        score,
        eligible,
        reason,
        recentMatchIds: recent.map(item => item.id),
      };
    })
    .sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.score - a.score || compareId(a.playerName, b.playerName));
}

export function selectColdPlayers(players: Player[], matches: Match[], seasonId: string, limit = 2): ColdFormEntry[] {
  return auditColdForm(players, matches, seasonId).filter(entry => entry.eligible).slice(0, limit);
}
