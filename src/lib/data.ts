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
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      efficiency: 0,
      lastCaptainDate: null,
      lastGoalDate: null,
      isActive: false,
      matchesInLast3: 0,
      matchesInLast5: 0,
      captaincyPriorityScore: 0,
      winsAsCaptain: 0,
      lossesAsCaptain: 0,
      drawsAsCaptain: 0,
      matchesSinceLastCaptain: 0,
    };
  });

  const sortedMatches = [...allMatches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const globalMatchesDesc = [...allMatches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const last5Ids = globalMatchesDesc.slice(0, 5).map(m => m.id);

  sortedMatches.forEach(match => {
    const teamAWon = match.teamAScore > match.teamBScore;
    const teamBWon = match.teamBScore > match.teamAScore;
    const draw = match.teamAScore === match.teamBScore && (match.teamAScore > 0 || match.teamBScore > 0);

    const processPlayer = (playerStat: PlayerStats, team: 'A' | 'B') => {
        const { playerId, goals, isCaptain, isMvp, hasBestGoal } = playerStat;
        if (statsMap[playerId]) {
            const stats = statsMap[playerId];
            stats.matchesPlayed++;
            stats.totalGoals += goals;
            stats.powerPoints += goals * POINTS.GOAL;

            const myTeamScore = team === 'A' ? match.teamAScore : match.teamBScore;
            const otherTeamScore = team === 'A' ? match.teamBScore : match.teamAScore;
            
            stats.goalsFor += myTeamScore;
            stats.goalsAgainst += otherTeamScore;

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

            if (isCaptain) {
              stats.totalCaptaincies++;
              stats.lastCaptainDate = match.date;
              stats.matchesSinceLastCaptain = 0;
              if (result === 'W') stats.winsAsCaptain++;
              if (result === 'D') stats.drawsAsCaptain++;
              if (result === 'L') stats.lossesAsCaptain++;
            } else {
              stats.matchesSinceLastCaptain++;
            }

            if (goals > 0) stats.lastGoalDate = match.date;

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

            if (last5Ids.includes(match.id)) stats.matchesInLast5++;
            
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
          stats.goalDifference = stats.goalsFor - stats.goalsAgainst;
          
          const pointsObtained = stats.wins * 3 + stats.draws;
          const pointsPossible = stats.matchesPlayed * 3;
          stats.efficiency = Math.round((pointsObtained / pointsPossible) * 100);

          stats.isActive = stats.matchesInLast5 >= 1;
          stats.captaincyPriorityScore = (stats.matchesInLast5 * 3) + (stats.matchesPlayed * 1) - (stats.totalCaptaincies * 4);
      }
      stats.form = [...stats.form].reverse();
  }

  return Object.values(statsMap);
};

/**
 * Calcula el ranking de duplas basándose en su química (partidos jugados juntos y victorias).
 * Es robusta y adaptativa: si no hay duplas con minMatches, baja el umbral automáticamente.
 */
export const getChemistryRankings = (players: Player[], matches: Match[], minMatchesThreshold = 2): ChemistryPair[] => {
  if (!players.length || !matches.length) return [];

  const chemistryMap: { [key: string]: { matches: number, wins: number } } = {};
  const playerStats = calculateAggregatedStats(players, matches);
  
  matches.forEach(match => {
    // Solo contamos partidos que tengan algún marcador para evitar ruido de partidos futuros
    if (match.teamAScore === 0 && match.teamBScore === 0) return;

    const teamAWon = match.teamAScore > match.teamBScore;
    const teamBWon = match.teamBScore > match.teamAScore;

    const processTeam = (teamPlayers: PlayerStats[], won: boolean) => {
      // Usamos los IDs de los jugadores presentes en el partido
      const ids = teamPlayers.map(p => p.playerId).filter(id => players.some(pl => pl.id === id));
      
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const key = [ids[i], ids[j]].sort().join('_::_');
          if (!chemistryMap[key]) chemistryMap[key] = { matches: 0, wins: 0 };
          chemistryMap[key].matches++;
          if (won) chemistryMap[key].wins++;
        }
      }
    };

    processTeam(match.teamAPlayers, teamAWon);
    processTeam(match.teamBPlayers, teamBWon);
  });

  const allPairs = Object.entries(chemistryMap)
    .map(([key, stats]) => {
      const [id1, id2] = key.split('_::_');
      const player1 = players.find(p => p.id === id1);
      const player2 = players.find(p => p.id === id2);
      const s1 = playerStats.find(s => s.playerId === id1);
      const s2 = playerStats.find(s => s.playerId === id2);
      
      if (!player1 || !player2) return null;

      return { 
        player1, 
        player2, 
        wins: stats.wins, 
        matches: stats.matches,
        winRate: Math.round((stats.wins / stats.matches) * 100),
        combinedPower: (s1?.powerPoints || 0) + (s2?.powerPoints || 0)
      };
    })
    .filter((pair): pair is ChemistryPair => pair !== null);

  // Fallback inteligente: si no hay nada con minMatchesThreshold, bajamos a 1
  let result = allPairs.filter(p => p.matches >= minMatchesThreshold);
  if (result.length === 0 && minMatchesThreshold > 1) {
    result = allPairs.filter(p => p.matches >= 1);
  }

  // Ordenamos por: 1. Win Rate, 2. Cantidad de Partidos, 3. Power Ranking Combinado
  return result.sort((a, b) => 
    b.winRate - a.winRate || 
    b.matches - a.matches || 
    b.combinedPower - a.combinedPower
  );
};

export const getSpiciestMatch = (matches: Match[]) => {
  if (matches.length === 0) return null;
  return [...matches].sort((a, b) => (b.teamAScore + b.teamBScore) - (a.teamAScore + a.teamBScore))[0];
};

export const balanceTeams = (selectedPlayers: AggregatedPlayerStats[]) => {
  const goalkeepers = selectedPlayers.filter(p => p.position === 'Arquero');
  const outfieldPlayers = selectedPlayers.filter(p => p.position !== 'Arquero');
  const teamA: AggregatedPlayerStats[] = [];
  const teamB: AggregatedPlayerStats[] = [];
  let scoreA = 0; let scoreB = 0;

  [...goalkeepers].sort((a, b) => b.powerPoints - a.powerPoints).forEach(gk => {
    if (scoreA <= scoreB) { teamA.push(gk); scoreA += gk.powerPoints; }
    else { teamB.push(gk); scoreB += gk.powerPoints; }
  });

  [...outfieldPlayers].sort((a, b) => b.powerPoints - a.powerPoints).forEach(p => {
    if (scoreA <= scoreB) { teamA.push(p); scoreA += p.powerPoints; }
    else { teamB.push(p); scoreB += p.powerPoints; }
  });

  return { teamA, teamB, scoreA, scoreB };
};