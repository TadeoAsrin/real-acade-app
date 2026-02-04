import type { Player, Match, AggregatedPlayerStats, PlayerStats, ChemistryPair } from "./definitions";

const POINTS = {
  WIN: 10,
  DRAW: 5,
  GOAL: 2,
  MVP: 15,
  BEST_GOAL: 5,
};

export const calculateAggregatedStats = (allPlayers: Player[], allMatches: Match[]): AggregatedPlayerStats[] => {
  const statsMap: { [key: string]: AggregatedPlayerStats } = {};

  allPlayers.forEach(player => {
    statsMap[player.id] = {
      playerId: player.id,
      name: player.name,
      avatar: player.avatar,
      position: player.position,
      matchesPlayed: 0,
      totalGoals: 0,
      totalCaptaincies: 0,
      totalMvp: 0,
      totalBestGoals: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winPercentage: 0,
      goalsPerMatch: 0,
      mvpPerMatch: 0,
      matchesAsBlue: 0,
      matchesAsRed: 0,
      powerPoints: 0,
      form: [],
    };
  });

  const sortedMatches = [...allMatches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  sortedMatches.forEach(match => {
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

            let result: 'W' | 'D' | 'L' = 'L';
            if (draw) {
                stats.draws++;
                stats.powerPoints += POINTS.DRAW;
                result = 'D';
            } else if ((team === 'A' && teamAWon) || (team === 'B' && teamBWon)) {
                stats.wins++;
                stats.powerPoints += POINTS.WIN;
                result = 'W';
            } else {
                stats.losses++;
            }
            
            stats.form.push(result);
            if (stats.form.length > 5) stats.form.shift();
        }
    };
    
    match.teamAPlayers.forEach(p => processPlayer(p, 'A'));
    match.teamBPlayers.forEach(p => processPlayer(p, 'B'));
  });

  for (const playerId in statsMap) {
      const stats = statsMap[playerId];
      if (stats.matchesPlayed > 0) {
          stats.winPercentage = Math.round((stats.wins / stats.matchesPlayed) * 100);
          stats.goalsPerMatch = Number((stats.totalGoals / stats.matchesPlayed).toFixed(2));
          stats.mvpPerMatch = Number((stats.totalMvp / stats.matchesPlayed).toFixed(2));
      }
      stats.form = [...stats.form].reverse();
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

export const getChemistryRankings = (players: Player[], matches: Match[], minMatches = 2): ChemistryPair[] => {
  const statsMap: { [key: string]: { matches: number, wins: number } } = {};
  
  matches.forEach(match => {
    const processTeam = (playerStats: PlayerStats[], teamWon: boolean) => {
      const ids = playerStats.map(p => p.playerId).filter(Boolean);
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const key = [ids[i], ids[j]].sort().join('_::_');
          if (!statsMap[key]) statsMap[key] = { matches: 0, wins: 0 };
          statsMap[key].matches++;
          if (teamWon) statsMap[key].wins++;
        }
      }
    };

    processTeam(match.teamAPlayers, match.teamAScore > match.teamBScore);
    processTeam(match.teamBPlayers, match.teamBScore > match.teamAScore);
  });

  return Object.entries(statsMap)
    .filter(([_, stats]) => stats.matches >= minMatches)
    .map(([key, stats]) => {
      const [id1, id2] = key.split('_::_');
      const player1 = players.find(p => p.id === id1);
      const player2 = players.find(p => p.id === id2);
      return { 
        player1: player1!, 
        player2: player2!, 
        wins: stats.wins, 
        matches: stats.matches,
        winRate: Math.round((stats.wins / stats.matches) * 100)
      };
    })
    .filter(pair => pair.player1 && pair.player2)
    .sort((a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      if (b.matches !== a.matches) return b.matches - a.matches;
      return b.wins - a.wins;
    });
};

// Mantenemos getTopChemistry por compatibilidad pero que use la nueva lógica interna
export const getTopChemistry = (players: Player[], matches: Match[], minMatches = 2): ChemistryPair | null => {
  const rankings = getChemistryRankings(players, matches, minMatches);
  return rankings.length > 0 ? rankings[0] : null;
};

export const getSpiciestMatch = (matches: Match[]) => {
  if (matches.length === 0) return null;
  return [...matches].sort((a, b) => {
    const totalA = a.teamAScore + a.teamBScore;
    const totalB = b.teamAScore + b.teamBScore;
    if (totalB !== totalA) return totalB - totalA;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  })[0];
};

export const balanceTeams = (selectedPlayers: AggregatedPlayerStats[]) => {
  const goalkeepers = selectedPlayers.filter(p => p.position === 'Arquero');
  const outfieldPlayers = selectedPlayers.filter(p => p.position !== 'Arquero');
  
  const teamA: AggregatedPlayerStats[] = [];
  const teamB: AggregatedPlayerStats[] = [];
  
  let scoreA = 0;
  let scoreB = 0;

  const sortedGKs = [...goalkeepers].sort((a, b) => b.powerPoints - a.powerPoints);
  sortedGKs.forEach(gk => {
    if (scoreA <= scoreB) {
      teamA.push(gk);
      scoreA += gk.powerPoints;
    } else {
      teamB.push(gk);
      scoreB += gk.powerPoints;
    }
  });

  const sortedOutfield = [...outfieldPlayers].sort((a, b) => b.powerPoints - a.powerPoints);
  sortedOutfield.forEach((player) => {
    if (scoreA <= scoreB) {
      teamA.push(player);
      scoreA += player.powerPoints;
    } else {
      teamB.push(player);
      scoreB += player.powerPoints;
    }
  });

  return { teamA, teamB, scoreA, scoreB };
};
