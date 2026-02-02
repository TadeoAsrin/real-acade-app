export type Player = {
  id: string;
  name: string;
  avatar: string;
  team: 'Amigos de Martes' | 'Resto del Mundo';
  role: 'admin' | 'player';
};

export type PlayerStats = {
  playerId: string;
  goals: number;
  isCaptain?: boolean;
  isMvp?: boolean;
  hasBestGoal?: boolean;
};

export type Match = {
  id: string;
  date: string;
  teamAScore: number;
  teamBScore: number;
  teamAPlayers: PlayerStats[];
  teamBPlayers: PlayerStats[];
};

export type AggregatedPlayerStats = {
  playerId: string;
  name: string;
  avatar: string;
  matchesPlayed: number;
  totalGoals: number;
  totalCaptaincies: number;
  totalMvp: number;
  totalBestGoals: number;
  wins: number;
  losses: number;
  draws: number;
  winPercentage: number;
};
