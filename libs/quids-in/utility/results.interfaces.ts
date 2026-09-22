export interface Participant {
  id: number;
  name: string;
  teamName: string;
}

export interface GameweekScore {
  bank?: number;
  chip?: string;
  points: number;
  squadValue?: number;
  transferCost: number;
  transfers: number;
}

export interface Gameweek {
  gameweek: number;
  scores: Record<string, GameweekScore>;
}

export interface Season {
  gameweeks: Array<Gameweek>;
  participants: Array<Participant>;
  season: string;
  source?: SeasonSource;
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
  highestScore: number;
  leagueAverage: number;
  lowestScore: number;
  spread: number;
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
