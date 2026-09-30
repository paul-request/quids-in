export interface Participant {
  id: number;
  name: string;
  teamName: string;
}

export interface GameweekScore {
  bank?: number;
  chip?: string;
  goalsConceded?: number;
  goalsScored?: number;
  points: number;
  squadValue?: number;
  transferCost: number;
  transfers: number;
}

export interface Gameweek {
  ended?: boolean;
  fplAverage?: number;
  gameweek: number;
  scores: Record<string, GameweekScore>;
}

export interface Season {
  fplCup?: FplCup;
  gameweeks: Array<Gameweek>;
  participants: Array<Participant>;
  season: string;
  source?: SeasonSource;
}

export interface FplCup {
  cupLeagueId: number;
  matches: Array<FplCupMatch>;
}

export interface FplCupMatch {
  entry1: number | null;
  entry1Points: number | null;
  entry2: number | null;
  entry2Points: number | null;
  gameweek: number;
  id: number;
  isBye: boolean;
  knockoutName?: string;
  winner: number | null;
}

export interface SeasonSource {
  leagueId: number;
  retrievedAt: string;
}

export interface Winner {
  participantId: number;
  winShare: number;
}

export interface GameweekResult {
  highestScore: number;
  winners: Array<Winner>;
  lowestScore: number;
  lastPlaceParticipantIds: Array<number>;
}

export interface LeaderboardRow {
  participantId: number;
  totalWins: number;
}

export interface SeasonLeaderboard {
  rows: Array<LeaderboardRow>;
  lastPlaceParticipantIds: Array<number>;
}

export interface BiggestSlugRow {
  participantId: number;
  weeklyLosses: number;
}

export interface AverageWeeklyPositionRow {
  participantId: number;
  averagePosition: number;
  averageWeeklyScore: number | undefined;
}

export interface SeasonBalanceRow {
  participantId: number;
  grossWinningsPennies: number;
  netBalancePennies: number;
  weeklyBalancePennies: number;
}

export interface AvailableGameweekStats {
  available: true;
  fplAverage?: number;
  highestScore: number;
  leagueAverage: number;
  lowestScore: number;
  spread: number;
  varianceFromFplAverage?: number;
  varianceFromSeasonAverage: number;
}

export interface UnavailableGameweekStats {
  available: false;
}

export type GameweekStats = AvailableGameweekStats | UnavailableGameweekStats;

export interface PlayerStats {
  averageLeaguePosition: number;
  averageWeeklyScore: number;
  highestScore: number;
  highestScoreGameweeks: Array<number>;
  lowestScore: number;
  lowestScoreGameweeks: Array<number>;
  participant: Participant;
  seasonBalancePennies: number;
  currentBalancePennies: number;
  totalTransfers: number;
  totalPoints: number;
}

export interface AvailableTeamValue {
  available: true;
  teamValueTenthsOfMillion: number;
}

export interface UnavailableTeamValue {
  available: false;
}

export type TeamValue = AvailableTeamValue | UnavailableTeamValue;
