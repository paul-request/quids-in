export type PlannerPosition = 1 | 2 | 3 | 4;

export interface PlannerData {
  finishedGameweeks: number;
  fixtures: Array<PlannerFixture>;
  gameweeks: Array<number>;
  generatedAt: string;
  players: Array<PlannerPlayer>;
  season: string;
  squads: Record<string, Array<PlannerPick>>;
  teams: Array<PlannerTeam>;
}

export interface PlannerTeam {
  id: number;
  name: string;
  shortName: string;
  strengthAttackAway: number;
  strengthAttackHome: number;
  strengthDefenceAway: number;
  strengthDefenceHome: number;
}

export interface PlannerPlayer {
  chanceOfPlaying: number | null;
  id: number;
  minutes: number;
  name: string;
  position: PlannerPosition;
  status: string;
  team: number;
  xAPer90: number;
  xGCPer90: number;
  xGPer90: number;
}

export interface PlannerFixture {
  awayDifficulty: number;
  awayTeam: number;
  event: number;
  homeDifficulty: number;
  homeTeam: number;
}

export interface PlannerPick {
  playerId: number;
  /** 1-11 are the starting XI, 12-15 the bench. */
  slot: number;
}

export interface ProjectedFixture {
  difficulty: number;
  home: boolean;
  opponent: string;
}

export interface ProjectedCell {
  fixtures: Array<ProjectedFixture>;
  gameweek: number;
  /** `undefined` for a blank Gameweek. */
  points?: number;
}

export interface PlannerRow {
  cells: Array<ProjectedCell>;
  name: string;
  playerId: number;
  position: PlannerPosition;
  sum: number;
  teamName: string;
}

export interface BestCaptain {
  gameweek: number;
  name?: string;
  points: number;
}

export interface PlannerTable {
  bench: Array<PlannerRow>;
  bestCaptains: Array<BestCaptain>;
  gameweeks: Array<number>;
  starters: Array<PlannerRow>;
  totalSum: number;
  xiTotals: Array<number>;
}

export interface TransferSuggestion {
  candidates: Array<PlannerRow>;
  position: PlannerPosition;
  /** The lowest-projected squad player in the same position. */
  replace?: PlannerRow;
}
