import type { Player, Match, AggregatedPlayerStats, PlayerStats } from "./definitions";

export const players: Player[] = [
  { id: '1', name: 'Leandro', avatar: 'https://picsum.photos/seed/player1/200/200', team: 'Amigos de Martes', role: 'admin', position: 'FWD', positionName: 'Delantero' },
  { id: '2', name: 'Matias', avatar: 'https://picsum.photos/seed/player2/200/200', team: 'Amigos de Martes', role: 'player', position: 'MID', positionName: 'Mediocampista' },
  { id: '3', name: 'Juan', avatar: 'https://picsum.photos/seed/player3/200/200', team: 'Amigos de Martes', role: 'player', position: 'MID', positionName: 'Mediocampista' },
  { id: '4', name: 'Diego', avatar: 'https://picsum.photos/seed/player4/200/200', team: 'Amigos de Martes', role: 'player', position: 'MID', positionName: 'Mediocampista' },
  { id: '5', name: 'Facundo', avatar: 'https://picsum.photos/seed/player5/200/200', team: 'Amigos de Martes', role: 'player', position: 'DEF', positionName: 'Defensor' },
  { id: '6', name: 'Sergio', avatar: 'https://picsum.photos/seed/player6/200/200', team: 'Amigos de Martes', role: 'player', position: 'DEF', positionName: 'Defensor' },
  { id: '7', name: 'Pablo', avatar: 'https://picsum.photos/seed/player7/200/200', team: 'Amigos de Martes', role: 'player', position: 'GK', positionName: 'Arquero' },
  { id: '8', name: 'Carlos', avatar: 'https://picsum.photos/seed/player8/200/200', team: 'Resto del Mundo', role: 'player', position: 'FWD', positionName: 'Delantero' },
  { id: '9', name: 'Jorge', avatar: 'https://picsum.photos/seed/player9/200/200', team: 'Resto del Mundo', role: 'player', position: 'MID', positionName: 'Mediocampista' },
  { id: '10', name: 'Ricardo', avatar: 'https://picsum.photos/seed/player10/200/200', team: 'Resto del Mundo', role: 'player', position: 'MID', positionName: 'Mediocampista' },
  { id: '11', name: 'Fernando', avatar: 'https://picsum.photos/seed/player11/200/200', team: 'Resto del Mundo', role: 'player', position: 'MID', positionName: 'Mediocampista' },
  { id: '12', name: 'Andres', avatar: 'https://picsum.photos/seed/player12/200/200', team: 'Resto del Mundo', role: 'player', position: 'DEF', positionName: 'Defensor' },
  { id: '13', name: 'Luis', avatar: 'https://picsum.photos/seed/player13/200/200', team: 'Resto del Mundo', role: 'player', position: 'DEF', positionName: 'Defensor' },
  { id: '14', name: 'Miguel', avatar: 'https://picsum.photos/seed/player14/200/200', team: 'Resto del Mundo', role: 'player', position: 'GK', positionName: 'Arquero' },
];

export const matches: Match[] = [
  {
    id: '1',
    date: '2024-07-09',
    teamAScore: 5,
    teamBScore: 3,
    teamAPlayers: [
      { playerId: '1', goals: 2, isCaptain: true, isMvp: true },
      { playerId: '2', goals: 1, hasBestGoal: true },
      { playerId: '3', goals: 1},
      { playerId: '4', goals: 1},
      { playerId: '5', goals: 0},
      { playerId: '6', goals: 0},
      { playerId: '7', goals: 0},
    ],
    teamBPlayers: [
      { playerId: '8', goals: 1, isCaptain: true },
      { playerId: '9', goals: 1},
      { playerId: '10', goals: 1},
      { playerId: '11', goals: 0},
      { playerId: '12', goals: 0},
      { playerId: '13', goals: 0},
      { playerId: '14', goals: 0},
    ],
  },
  {
    id: '2',
    date: '2024-07-02',
    teamAScore: 2,
    teamBScore: 4,
    teamAPlayers: [
      { playerId: '1', goals: 1 },
      { playerId: '2', goals: 1, isCaptain: true },
      { playerId: '3', goals: 0 },
      { playerId: '4', goals: 0 },
      { playerId: '5', goals: 0 },
      { playerId: '6', goals: 0 },
      { playerId: '7', goals: 0 },
    ],
    teamBPlayers: [
      { playerId: '8', goals: 2, isCaptain: true, isMvp: true, hasBestGoal: true },
      { playerId: '9', goals: 1 },
      { playerId: '10', goals: 1 },
      { playerId: '11', goals: 0 },
      { playerId: '12', goals: 0 },
      { playerId: '13', goals: 0 },
      { playerId: '14', goals: 0 },
    ],
  },
  {
    id: '3',
    date: '2024-06-25',
    teamAScore: 6,
    teamBScore: 6,
    teamAPlayers: [
        { playerId: '1', goals: 3, isCaptain: true, isMvp: true },
        { playerId: '2', goals: 2 },
        { playerId: '3', goals: 1 },
        { playerId: '4', goals: 0 },
    ],
    teamBPlayers: [
        { playerId: '8', goals: 4, isCaptain: true, hasBestGoal: true },
        { playerId: '9', goals: 1 },
        { playerId: '10', goals: 1 },
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
        const { playerId, goals, isCaptain, isMvp, hasBestGoal } = playerStat;
        if (statsMap[playerId]) {
            const stats = statsMap[playerId];
            stats.matchesPlayed++;
            stats.totalGoals += goals;
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

  return Object.values(statsMap).sort((a, b) => b.totalGoals - a.totalGoals);
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
