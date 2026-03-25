
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

export type MatchAiSummary = {
  title: string;
  subtitle: string;
  summary: string;
};

export type Match = {
  id: string;
  date: string;
  teamAScore: number;
  teamBScore: number;
  teamAPlayers: PlayerStats[];
  teamBPlayers: PlayerStats[];
  comment?: string;
  photos?: string[];
  aiSummary?: MatchAiSummary;
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
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  efficiency: number;
  lastCaptainDate?: string | null;
  lastGoalDate?: string | null;
  isActive: boolean;
  matchesInLast3: number;
  matchesInLast5: number;
  captaincyPriorityScore: number;
  winsAsCaptain: number;
  lossesAsCaptain: number;
  drawsAsCaptain: number;
  matchesSinceLastCaptain: number;
  lethalityIndex: number;
};

export type ChemistryPair = {
  player1: Player;
  player2: Player;
  wins: number;
  matches: number;
  winRate: number;
};

export type Draft = {
  id: string;
  date: string;
  status: 'pending' | 'completed';
  captainA: Player;
  captainB: Player;
  availablePlayers: Player[];
  teamAPlayers: Player[];
  teamBPlayers: Player[];
  picks: { playerId: string; captain: 'A' | 'B' }[];
};

export type GalleryItem = {
  id: string;
  type: 'image' | 'video';
  url: string;
  description?: string;
  date: string;
  category?: string;
  matchId?: string;
};
