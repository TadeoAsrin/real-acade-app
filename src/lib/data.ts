import type { Player, Match, AggregatedPlayerStats, PlayerStats } from "./definitions";

export const players: Player[] = [
  { id: '1', name: 'Leandro', avatar: 'https://picsum.photos/seed/player1/200/200', team: 'Amigos de Martes', role: 'admin' },
  { id: '2', name: 'Matias', avatar: 'https://picsum.photos/seed/player2/200/200', team: 'Amigos de Martes', role: 'player' },
  { id: '3', name: 'Juan', avatar: 'https://picsum.photos/seed/player3/200/200', team: 'Amigos de Martes', role: 'player' },
  { id: '4', name: 'Diego', avatar: 'https://picsum.photos/seed/player4/200/200', team: 'Amigos de Martes', role: 'player' },
  { id: '5', name: 'Facundo', avatar: 'https://picsum.photos/seed/player5/200/200', team: 'Amigos de Martes', role: 'player' },
  { id: '6', name: 'Sergio', avatar: 'https://picsum.photos/seed/player6/200/200', team: 'Amigos de Martes', role: 'player' },
  { id: '7', name: 'Pablo', avatar: 'https://picsum.photos/seed/player7/200/200', team: 'Amigos de Martes', role: 'player' },
  { id: '8', name: 'Carlos', avatar: 'https://picsum.photos/seed/player8/200/200', team: 'Resto del Mundo', role: 'player' },
  { id: '9', name: 'Jorge', avatar: 'https://picsum.photos/seed/player9/200/200', team: 'Resto del Mundo', role: 'player' },
  { id: '10', name: 'Ricardo', avatar: 'https://picsum.photos/seed/player10/200/200', team: 'Resto del Mundo', role: 'player' },
  { id: '11', name: 'Fernando', avatar: 'https://picsum.photos/seed/player11/200/200', team: 'Resto del Mundo', role: 'player' },
  { id: '12', name: 'Andres', avatar: 'https://picsum.photos/seed/player12/200/200', team: 'Resto del Mundo', role: 'player' },
  { id: '13', name: 'Luis', avatar: 'https://picsum.photos/seed/player13/200/200', team: 'Resto del Mundo', role: 'player' },
  { id: '14', name: 'Miguel', avatar: 'https://picsum.photos/seed/player14/200/200', team: 'Resto del Mundo', role: 'player' },
];

export const matches: Match[] = [
  {
    id: '1',
    date: '2024-07-09',
    teamAScore: 5,
    teamBScore: 3,
    teamAPlayers: [
      { playerId: '1', goals: 2, yellowCards: 0, redCards: 0, ratings: [{ratedBy: '2', rating: 9}, {ratedBy: '3', rating: 8}], isCaptain: true, isMvp: true },
      { playerId: '2', goals: 1, yellowCards: 0, redCards: 0, ratings: [{ratedBy: '1', rating: 8}], hasBestGoal: true },
      { playerId: '3', goals: 1, yellowCards: 1, redCards: 0, ratings: []},
      { playerId: '4', goals: 1, yellowCards: 0, redCards: 0, ratings: []},
      { playerId: '5', goals: 0, yellowCards: 0, redCards: 0, ratings: []},
      { playerId: '6', goals: 0, yellowCards: 0, redCards: 0, ratings: []},
      { playerId: '7', goals: 0, yellowCards: 0, redCards: 0, ratings: []},
    ],
    teamBPlayers: [
      { playerId: '8', goals: 1, yellowCards: 0, redCards: 0, ratings: [], isCaptain: true },
      { playerId: '9', goals: 1, yellowCards: 0, redCards: 0, ratings: []},
      { playerId: '10', goals: 1, yellowCards: 1, redCards: 0, ratings: []},
      { playerId: '11', goals: 0, yellowCards: 0, redCards: 0, ratings: []},
      { playerId: '12', goals: 0, yellowCards: 0, redCards: 0, ratings: []},
      { playerId: '13', goals: 0, yellowCards: 0, redCards: 0, ratings: []},
      { playerId: '14', goals: 0, yellowCards: 0, redCards: 0, ratings: []},
    ],
  },
  {
    id: '2',
    date: '2024-07-02',
    teamAScore: 2,
    teamBScore: 4,
    teamAPlayers: [
      { playerId: '1', goals: 1, yellowCards: 0, redCards: 0, ratings: [] },
      { playerId: '2', goals: 1, yellowCards: 0, redCards: 0, ratings: [], isCaptain: true },
      { playerId: '3', goals: 0, yellowCards: 0, redCards: 0, ratings: [] },
      { playerId: '4', goals: 0, yellowCards: 1, redCards: 0, ratings: [] },
      { playerId: '5', goals: 0, yellowCards: 0, redCards: 0, ratings: [] },
      { playerId: '6', goals: 0, yellowCards: 0, redCards: 0, ratings: [] },
      { playerId: '7', goals: 0, yellowCards: 0, redCards: 0, ratings: [] },
    ],
    teamBPlayers: [
      { playerId: '8', goals: 2, yellowCards: 0, redCards: 0, ratings: [], isCaptain: true, isMvp: true, hasBestGoal: true },
      { playerId: '9', goals: 1, yellowCards: 0, redCards: 0, ratings: [] },
      { playerId: '10', goals: 1, yellowCards: 0, redCards: 0, ratings: [] },
      { playerId: '11', goals: 0, yellowCards: 0, redCards: 0, ratings: [] },
      { playerId: '12', goals: 0, yellowCards: 1, redCards: 0, ratings: [] },
      { playerId: '13', goals: 0, yellowCards: 0, redCards: 0, ratings: [] },
      { playerId: '14', goals: 0, yellowCards: 0, redCards: 0, ratings: [] },
    ],
  },
  {
    id: '3',
    date: '2024-06-25',
    teamAScore: 6,
    teamBScore: 6,
    teamAPlayers: [
        { playerId: '1', goals: 3, yellowCards: 0, redCards: 0, ratings: [], isCaptain: true, isMvp: true },
        { playerId: '2', goals: 2, yellowCards: 0, redCards: 0, ratings: [] },
        { playerId: '3', goals: 1, yellowCards: 0, redCards: 0, ratings: [] },
        { playerId: '4', goals: 0, yellowCards: 0, redCards: 0, ratings: [] },
    ],
    teamBPlayers: [
        { playerId: '8', goals: 4, yellowCards: 0, redCards: 0, ratings: [], isCaptain: true, hasBestGoal: true },
        { playerId: '9', goals: 1, yellowCards: 0, redCards: 0, ratings: [] },
        { playerId: '10', goals: 1, yellowCards: 1, redCards: 0, ratings: [] },
    ]
  }
];


export const getAggregatedPlayerStats = (): AggregatedPlayerStats[] => {
  const statsMap: { [key: string]: AggregatedPlayerStats } = {};

  players.forEach(player => {
    statsMap[player.id] = {
      playerId: player.id,
      name: player.name,
      avatar: player.avatar,
      matchesPlayed: 0,
      totalGoals: 0,
      totalYellowCards: 0,
      totalRedCards: 0,
      averageRating: null,
      totalCaptaincies: 0,
      totalMvp: 0,
      totalBestGoals: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winPercentage: 0,
    };
  });

  matches.forEach(match => {
    const teamAWon = match.teamAScore > match.teamBScore;
    const teamBWon = match.teamBScore > match.teamAScore;
    const draw = match.teamAScore === match.teamBScore;

    const processPlayer = (playerStat: PlayerStats, team: 'A' | 'B') => {
        const { playerId, goals, yellowCards, redCards, ratings, isCaptain, isMvp, hasBestGoal } = playerStat;
        if (statsMap[playerId]) {
            const stats = statsMap[playerId];
            stats.matchesPlayed++;
            stats.totalGoals += goals;
            stats.totalYellowCards += yellowCards ?? 0;
            stats.totalRedCards += redCards ?? 0;
            if (isCaptain) stats.totalCaptaincies++;
            if (isMvp) stats.totalMvp++;
            if (hasBestGoal) stats.totalBestGoals++;

            if (draw) {
                stats.draws++;
            } else if ((team === 'A' && teamAWon) || (team === 'B' && teamBWon)) {
                stats.wins++;
            } else {
                stats.losses++;
            }
            
            if (ratings && ratings.length > 0) {
              const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
              const currentTotalRating = (stats.averageRating || 0) * (stats.matchesPlayed - 1);
              // This is a simplification; a real app would store ratings differently
              stats.averageRating = (currentTotalRating + totalRating / ratings.length) / stats.matchesPlayed;
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

export const getPlayerById = (id: string): Player | undefined => {
    return players.find(p => p.id === id);
}

export const getAggregatedStatsForPlayer = (playerId: string): AggregatedPlayerStats | undefined => {
    return getAggregatedPlayerStats().find(p => p.playerId === playerId);
}

export const getMatchHistoryForPlayer = (playerId: string): (PlayerStats & {matchId: string, date: string})[] => {
    const history: (PlayerStats & {matchId: string, date: string})[] = [];
    matches.forEach(match => {
        const playerStat = [...match.teamAPlayers, ...match.teamBPlayers].find(p => p.playerId === playerId);
        if (playerStat) {
            history.push({
                ...playerStat,
                matchId: match.id,
                date: match.date,
            });
        }
    });
    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export const getMatchById = (id: string): Match | undefined => {
  return matches.find(m => m.id === id);
}
