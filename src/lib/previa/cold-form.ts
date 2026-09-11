import type { Match, Player } from '../definitions';

export type ColdFormEntry = {
  playerId: string;
  playerName: string;
  appearances: number;
  minimumRequired: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  pointsPerGame: number;
  lossPercentage: number;
  losingStreak: number;
  score: number;
  eligible: boolean;
  reason: string;
  recentMatchIds: string[];
};

const compareId = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const minimumEligibleMatches = (seasonMatches: number) => Math.max(3, Math.ceil(seasonMatches * 0.4));

export function auditColdForm(players: Player[], matches: Match[], seasonId: string): ColdFormEntry[] {
  const played = matches
    .filter(match => match.seasonId === seasonId && (match.teamAScore > 0 || match.teamBScore > 0))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || (a.matchNumber ?? 0) - (b.matchNumber ?? 0) || compareId(a.id, b.id));

  const minimumRequired = minimumEligibleMatches(played.length);

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

      const wins = appearances.filter(item => item.result === 'W').length;
      const draws = appearances.filter(item => item.result === 'D').length;
      const losses = appearances.filter(item => item.result === 'L').length;
      const points = wins * 3 + draws;
      const pointsPerGame = appearances.length ? Math.round((points / appearances.length) * 100) / 100 : 0;
      const lossPercentage = appearances.length ? Math.round((losses / appearances.length) * 100) : 0;

      let losingStreak = 0;
      for (const item of [...appearances].reverse()) {
        if (item.result !== 'L') break;
        losingStreak++;
      }

      const enoughSample = appearances.length >= minimumRequired;
      const poorSeason = enoughSample && pointsPerGame <= 1;
      const highLossRate = enoughSample && lossPercentage >= 60;
      const hardStreak = enoughSample && losingStreak >= 3;
      const eligible = enoughSample && (poorSeason || highLossRate || hardStreak);

      const score = eligible
        ? Math.round((
            Math.max(0, 1.5 - pointsPerGame) * 45
            + lossPercentage * 0.55
            + losingStreak * 12
            + (points === 0 ? 25 : 0)
          ) * 100) / 100
        : 0;

      let reason = `Fuera: ${appearances.length}/${minimumRequired} PJ; todavía no alcanza la muestra mínima.`;
      if (enoughSample && points === 0) reason = `Entra: 0 puntos en ${appearances.length} partidos de la temporada.`;
      else if (enoughSample && pointsPerGame <= 1) reason = `Entra: ${points} puntos en ${appearances.length} PJ (${pointsPerGame} PPG).`;
      else if (enoughSample && lossPercentage >= 60) reason = `Entra: perdió ${lossPercentage}% de sus partidos.`;
      else if (enoughSample && losingStreak >= 3) reason = `Entra: ${losingStreak} derrotas consecutivas.`;
      else if (enoughSample) reason = `Fuera: rendimiento acumulado por encima del umbral negativo.`;

      return {
        playerId: player.id,
        playerName: player.name,
        appearances: appearances.length,
        minimumRequired,
        wins,
        draws,
        losses,
        points,
        pointsPerGame,
        lossPercentage,
        losingStreak,
        score,
        eligible,
        reason,
        recentMatchIds: appearances.map(item => item.id),
      };
    })
    .sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.score - a.score || compareId(a.playerName, b.playerName));
}

export function selectColdPlayers(players: Player[], matches: Match[], seasonId: string, limit = 2): ColdFormEntry[] {
  return auditColdForm(players, matches, seasonId).filter(entry => entry.eligible).slice(0, limit);
}
