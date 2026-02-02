
import type { Player, Match, AggregatedPlayerStats, PlayerStats } from "./definitions";

// Static data removed to rely on Firebase Firestore
export const players: Player[] = [];
export const matches: Match[] = [];

const POINTS = {
  WIN: 10,
  DRAW: 5,
  GOAL: 2,
  MVP: 15,
  BEST_GOAL: 5,
};

/**
 * Calculates aggregated statistics from a list of players and matches.
 * Useful for processing data fetched from Firestore.
 */
export const calculateAggregatedStats = (allPlayers: Player[], allMatches: Match[]): AggregatedPlayerStats[] => {
  const statsMap: { [key: string]: AggregatedPlayerStats } = {};

  allPlayers.forEach(player => {
    statsMap[player.id] = {
      playerId: player.id,
      name: player.name,
      avatar: player.avatar,
      matchesPlayed: 0,
      totalGoals: 0,
      totalCaptaincies: 0,
      totalMvp: 0,
      totalBestGoals: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winPercentage: 0,
      matchesAsBlue: 0,
      matchesAsRed: 0,
      powerPoints: 0,
    };
  });

  allMatches.forEach(match => {
    const teamAWon = match.teamAScore > match.teamBScore;
    const teamBWon = match.teamBScore > match.teamAScore;
    const draw = match.teamAScore === match.teamBScore;

    const processPlayer = (playerStat: PlayerStats, team: 'A' | 'B') => {
        const { playerId, goals, isCaptain, isMvp, hasBestGoal } = playerStat;
        if (statsMap[playerId]) {
            const stats = statsMap[playerId];
            stats.matchesPlayed++;
            stats.totalGoals += goals;
            stats.powerPoints += goals * POINTS.GOAL;

            if (isCaptain) stats.totalCaptaincies++;
            if (isMvp) {
              stats.totalMvp++;
              stats.powerPoints += POINTS.MVP;
            }
            if (hasBestGoal) {
              stats.totalBestGoals++;
              stats.powerPoints += POINTS.BEST_GOAL;
            }

            if (team === 'A') stats.matchesAsBlue++;
            else stats.matchesAsRed++;

            if (draw) {
                stats.draws++;
                stats.powerPoints += POINTS.DRAW;
            } else if ((team === 'A' && teamAWon) || (team === 'B' && teamBWon)) {
                stats.wins++;
                stats.powerPoints += POINTS.WIN;
            } else {
                stats.losses++;
            }
        }
    };
    
    match.teamAPlayers.forEach(p => processPlayer(p, 'A'));
    match.teamBPlayers.forEach(p => processPlayer(p, 'B'));
  });

  for (const playerId in statsMap) {
      const stats = statsMap[playerId];
      if (stats.matchesPlayed > 0) {
          stats.winPercentage = Math.round((stats.wins / stats.matchesPlayed) * 100);
      }
  }

  return Object.values(statsMap);
};

export const getTeamGlobalStats = (allMatches: Match[]) => {
    let blueWins = 0;
    let redWins = 0;
    let draws = 0;

    allMatches.forEach(match => {
        if (match.teamAScore > match.teamBScore) blueWins++;
        else if (match.teamBScore > match.teamAScore) redWins++;
        else draws++;
    });

    return { blueWins, redWins, draws, total: allMatches.length };
};
