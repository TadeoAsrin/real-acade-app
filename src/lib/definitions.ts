export type PlayerPosition = 'Arquero' | 'Lateral Derecho' | 'Defensor Central' | 'Lateral Izquierdo' | 'Mediocampista' | 'Delantero';

export type Player = {
  id: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'player';
  position?: PlayerPosition;
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
  avatar?: string;
  position?: PlayerPosition;
  matchesPlayed: number;
  totalGoals: number;
  totalCaptaincies: number;
  totalMvp: number;
  totalBestGoals: number;
  wins: number;
  losses: number;
  draws: number;
  winPercentage: number;
  goalsPerMatch: number;
  mvpPerMatch: number;
  matchesAsBlue: number;
  matchesAsRed: number;
  powerPoints: number;
  form: ('W' | 'D' | 'L')[];
};

export type ChemistryPair = {
  player1: Player;
  player2: Player;
  wins: number;
  matches: number;
};
