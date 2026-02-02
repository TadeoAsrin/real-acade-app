import type { Player, Match, AggregatedPlayerStats, PlayerStats } from "./definitions";

export const players: Player[] = [
  { id: '1', name: 'Leandro', avatar: 'https://images.unsplash.com/photo-1594672830234-ba4cfe1202dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8bWFuJTIwcG9ydHJhaXR8ZW58MHx8fHwxNzY5OTcxMTc1fDA&ixlib=rb-4.1.0&q=80&w=1080', role: 'admin' },
  { id: '2', name: 'Matias', avatar: 'https://images.unsplash.com/photo-1557053910-d9eadeed1c58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHx3b21hbiUyMHBvcnRyYWl0fGVufDB8fHx8MTc3MDAxODk3OXww&ixlib=rb-4.1.0&q=80&w=1080', role: 'player' },
  { id: '3', name: 'Juan', avatar: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxwZXJzb24lMjBwb3J0cmFpdHxlbnwwfHx8fDE3NzAwMTIyNzd8MA&ixlib=rb-4.1.0&q=80&w=1080', role: 'player' },
  { id: '4', name: 'Diego', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdHxlbnwwfHx8fDE3Njk5NzExNzV8MA&ixlib=rb-4.1.0&q=80&w=1080', role: 'player' },
  { id: '5', name: 'Facundo', avatar: 'https://images.unsplash.com/photo-1557053910-d9eadeed1c58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHx3b21hbiUyMHBvcnRyYWl0fGVufDB8fHx8MTc3MDAxODk3OXww&ixlib=rb-4.1.0&q=80&w=1080', role: 'player' },
  { id: '6', name: 'Sergio', avatar: 'https://images.unsplash.com/flagged/photo-1595514191830-3e96a518989b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8cGVyc29uJTIwcG9ydHJhaXR8ZW58MHx8fHwxNzcwMDEyMjc3fDA&ixlib=rb-4.1.0&q=80&w=1080', role: 'player' },
  { id: '7', name: 'Pablo', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdHxlbnwwfHx8fDE3Njk5NzExNzV8MA&ixlib=rb-4.1.0&q=80&w=1080', role: 'player' },
  { id: '8', name: 'Carlos', avatar: 'https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8d29tYW4lMjBwb3J0cmFpdHxlbnwwfHx8fDE3NzAwMTg5Nzl8MA&ixlib=rb-4.1.0&q=80&w=1080', role: 'player' },
  { id: '9', name: 'Jorge', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxwZXJzb24lMjBwb3J0cmFpdHxlbnwwfHx8fDE3NzAwMTIyNzd8MA&ixlib=rb-4.1.0&q=80&w=1080', role: 'player' },
  { id: '10', name: 'Ricardo', avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHxtYW4lMjBwb3J0cmFpdHxlbnwwfHx8fDE3Njk5NzExNzV8MA&ixlib=rb-4.1.0&q=80&w=1080', role: 'player' },
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
    ],
    teamBPlayers: [
      { playerId: '8', goals: 1, isCaptain: true },
      { playerId: '9', goals: 1},
      { playerId: '10', goals: 1},
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
    ],
    teamBPlayers: [
      { playerId: '8', goals: 2, isCaptain: true, isMvp: true, hasBestGoal: true },
      { playerId: '9', goals: 1 },
      { playerId: '10', goals: 1 },
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
    ],
    teamBPlayers: [
        { playerId: '8', goals: 4, isCaptain: true, hasBestGoal: true },
        { playerId: '9', goals: 1 },
        { playerId: '10', goals: 1 },
    ]
  }
];

const POINTS = {
  WIN: 10,
  DRAW: 5,
  GOAL: 2,
  MVP: 15,
  BEST_GOAL: 5,
};

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
      matchesAsBlue: 0,
      matchesAsRed: 0,
      powerPoints: 0,
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

export const getTeamGlobalStats = () => {
    let blueWins = 0;
    let redWins = 0;
    let draws = 0;

    matches.forEach(match => {
        if (match.teamAScore > match.teamBScore) blueWins++;
        else if (match.teamBScore > match.teamAScore) redWins++;
        else draws++;
    });

    return { blueWins, redWins, draws, total: matches.length };
};

export const getPlayerById = (id: string): Player | undefined => {
    return players.find(p => p.id === id);
}

export const getAggregatedStatsForPlayer = (playerId: string): AggregatedPlayerStats | undefined => {
    return getAggregatedPlayerStats().find(p => p.playerId === playerId);
}

export const getMatchHistoryForPlayer = (playerId: string): (PlayerStats & {matchId: string, date: string, team: 'Azul' | 'Rojo'})[] => {
    const history: (PlayerStats & {matchId: string, date: string, team: 'Azul' | 'Rojo'})[] = [];
    matches.forEach(match => {
        const playerStatA = match.teamAPlayers.find(p => p.playerId === playerId);
        const playerStatB = match.teamBPlayers.find(p => p.playerId === playerId);
        
        if (playerStatA) {
            history.push({ ...playerStatA, matchId: match.id, date: match.date, team: 'Azul' });
        } else if (playerStatB) {
            history.push({ ...playerStatB, matchId: match.id, date: match.date, team: 'Rojo' });
        }
    });
    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export const getMatchById = (id: string): Match | undefined => {
  return matches.find(m => m.id === id);
}
