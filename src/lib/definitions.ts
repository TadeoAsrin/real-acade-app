export type Player = {
  id: string;
  name: string;
  avatar: string;
  team: 'Amigos de Martes' | 'Resto del Mundo';
  role: 'admin' | 'player';
  position: string;
  positionName: string;
};

export type PlayerStats = {
  playerId: string;
  goals: number;
  ratings?: PlayerRating[];
  isCaptain?: boolean;
  isMvp?: boolean;
  hasBestGoal?: boolean;
};

export type PlayerRating = {
  ratedBy: string; // playerId of the user who rated
  rating: number; // 1-10
}

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
  averageRating: number | null;
  totalCaptaincies: number;
  totalMvp: number;
  totalBestGoals: number;
  wins: number;
  losses: number;
  draws: number;
  winPercentage: number;
};
