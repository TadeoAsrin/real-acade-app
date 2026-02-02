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
  assists: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
  ratings?: PlayerRating[];
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
  totalAssists: number;
  totalFouls: number;
  totalYellowCards: number;
  totalRedCards: number;
  averageRating: number | null;
};
