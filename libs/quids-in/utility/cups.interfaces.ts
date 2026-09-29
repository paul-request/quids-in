export interface CupDrawFile {
  cups: Array<CupDraw>;
  generatedAt: string;
  season: string;
}

export interface CupDraw {
  id: string;
  name: string;
  revealAfterGameweek: number;
  round1Fixtures: Array<CupDrawFixture>;
  startGameweek: number;
}

export interface CupDrawFixture {
  fixture: number;
  participantIds: Array<number | null>;
}

export interface CupDefinition {
  id: string;
  name: string;
  revealAfterGameweek: number;
  startGameweek: number;
}

export interface ParticipantCupSlot {
  kind: 'participant';
  obfuscated: boolean;
  participantId: number;
  score?: number;
}

export interface ByeCupSlot {
  kind: 'bye';
  obfuscated: boolean;
}

export interface WinnerOfCupSlot {
  kind: 'winner-of';
  tieLabel: string;
}

export interface ToBeDrawnCupSlot {
  kind: 'to-be-drawn';
}

export type CupSlot = ByeCupSlot | ParticipantCupSlot | ToBeDrawnCupSlot | WinnerOfCupSlot;

export type CupTieStatus = 'decided' | 'obfuscated' | 'provisional' | 'scheduled' | 'walkover';

export type CupTieBreak = 'coin-toss' | 'goals-conceded' | 'goals-scored' | 'missing-score';

export interface CupTie {
  label: string;
  slots: [CupSlot, CupSlot];
  status: CupTieStatus;
  tieBreak?: CupTieBreak;
  winnerParticipantId?: number;
}

export interface CupRound {
  gameweek: number;
  name: string;
  ties: Array<CupTie>;
}

export interface CupBracket {
  championParticipantId?: number;
  drawAvailable: boolean;
  id: string;
  name: string;
  revealAfterGameweek: number;
  revealed: boolean;
  rounds: Array<CupRound>;
  startGameweek: number;
}

export interface CupPrize {
  startGameweek: number;
  winnerParticipantId?: number;
}
