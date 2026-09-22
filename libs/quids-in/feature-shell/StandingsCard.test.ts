import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import StandingsCard from './StandingsCard.svelte';
import type { Participant, SeasonLeaderboard } from '../utility/results.interfaces';

const participants: Array<Participant> = [
  { id: 1, name: 'Alice', teamName: 'Aces High' },
  { id: 2, name: 'Ben', teamName: 'Biscuit Boys' },
  { id: 3, name: 'Chloe', teamName: 'Chilli Chasers' },
];

const leaderboard: SeasonLeaderboard = {
  rows: [
    { participantId: 2, totalWins: 1.5 },
    { participantId: 1, totalWins: 1.5 },
    { participantId: 3, totalWins: 0 },
  ],
  lastPlaceParticipantIds: [3],
};

describe('StandingsCard', () => {
  it('renders position, player/team, and wins for every ranked participant', () => {
    render(StandingsCard, { props: { leaderboard, participants } });

    expect(screen.getByRole('heading', { name: 'Overall standings' })).toBeTruthy();

    const dataRows = screen.getAllByRole('row').slice(1);
    expect(dataRows[0].textContent).toContain('Ben');
    expect(dataRows[0].textContent).toContain('1.5');
    expect(dataRows[1].textContent).toContain('Alice');
    expect(dataRows[2].textContent).toContain('Chloe');
  });

  it('marks tied positions with an equals sign instead of repeating a rank number', () => {
    render(StandingsCard, { props: { leaderboard, participants } });

    const dataRows = screen.getAllByRole('row').slice(1);
    expect(dataRows[0].textContent).toContain('1');
    expect(dataRows[1].textContent).toContain('=');
  });

  it('toggles sort order between position and wins', async () => {
    render(StandingsCard, { props: { leaderboard, participants } });

    await fireEvent.click(screen.getByRole('button', { name: 'Wins' }));

    let dataRows = screen.getAllByRole('row').slice(1);
    expect(dataRows[dataRows.length - 1].textContent).toContain('Chloe');

    await fireEvent.click(screen.getByRole('button', { name: 'Wins' }));

    dataRows = screen.getAllByRole('row').slice(1);
    expect(dataRows[0].textContent).toContain('Chloe');
  });
});
