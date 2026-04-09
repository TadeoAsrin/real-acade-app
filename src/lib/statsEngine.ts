import type { Match, Player, AggregatedPlayerStats, PlayerStats } from "./definitions";

/**
 * Centralized Stats Engine for Real Acade
 * Handles complex metrics like Influence Score, The Wall (Defense), and Streaks.
 */

export function getPlayerStats(matches: Match[], playerId: string): Partial<AggregatedPlayerStats> {
  const playedMatches = matches.filter(m => 
    m.teamAPlayers.some(p => p.playerId === playerId) || 
    m.teamBPlayers.some(p => p.playerId === playerId)
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let wins = 0;
  let goals = 0;
  let goalsAgainst = 0;
  let currentStreak = 0;
  let maxStreak = 0;

  playedMatches.forEach(match => {
    const isTeamA = match.teamAPlayers.some(p => p.playerId === playerId);
    const pStat = isTeamA 
      ? match.teamAPlayers.find(p => p.playerId === playerId)
      : match.teamBPlayers.find(p => p.playerId === playerId);

    if (!pStat) return;

    goals += pStat.goals || 0;
    
    // Calculate goals against
    if (isTeamA) {
      goalsAgainst += match.teamBScore;
    } else {
      goalsAgainst += match.teamAScore;
    }

    const teamAWon = match.teamAScore > match.teamBScore;
    const teamBWon = match.teamBScore > match.teamAScore;
    const isWin = (isTeamA && teamAWon) || (!isTeamA && teamBWon);

    if (isWin) {
      wins++;
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  const matchesPlayed = playedMatches.length;
  const winRate = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;
  
  // FORMULA: influenceScore = (wins + 2) / (matchesPlayed + 4)
  const influenceScore = matchesPlayed > 0 ? (wins + 2) / (matchesPlayed + 4) : 0;
  
  // FORMULA: avgGoalsAgainst = totalGoalsAgainst / matchesPlayed
  const avgGoalsAgainst = matchesPlayed > 0 ? Number((goalsAgainst / matchesPlayed).toFixed(2)) : 0;

  return {
    matchesPlayed,
    wins,
    totalGoals: goals,
    goalsAgainst,
    avgGoalsAgainst,
    winPercentage: winRate,
    influenceScore,
    bestStreak: maxStreak
  };
}

export function getLeaderboard(players: Player[], matches: Match[]): AggregatedPlayerStats[] {
  return players.map(player => {
    const stats = getPlayerStats(matches, player.id);
    return {
      playerId: player.id,
      name: player.name,
      avatar: player.avatar,
      position: player.position,
      ...stats
    } as AggregatedPlayerStats;
  }).filter(p => p.matchesPlayed >= 4); 
}
