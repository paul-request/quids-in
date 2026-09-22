import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import GameweekScoresTable from './GameweekScoresTable.svelte';

describe('GameweekScoresTable', () => {
  it('should render semantic score rows with winner and last-place indicators', async () => {
    render(GameweekScoresTable, {
      props: {
        gameweek: {
          gameweek: 1,
          scores: {
            '1': { points: 50, transfers: 2, transferCost: 4 },
            '2': {
              chip: 'wildcard',
              points: 30,
              transfers: 0,
              transferCost: 0,
            },
          },
        },
        participants: [
          { id: 1, name: 'Alice', teamName: 'Aces High' },
          { id: 2, name: 'Ben', teamName: 'Biscuit Boys' },
        ],
        result: {
          highestScore: 50,
          lastPlaceParticipantIds: [2],
          lowestScore: 30,
          winners: [{ participantId: 1, winShare: 1 }],
        },
      },
    });

    expect(screen.getByRole('table')).toBeTruthy();
    expect(
      screen.getByRole('row', {
        name: 'Alice Aces High 🏆 Winner 50',
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole('row', {
        name: 'Ben Biscuit Boys 🐌 Slug 30 Chip: Wildcard',
      }),
    ).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Player/team' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Score' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Chip' })).toBeTruthy();
    expect(screen.getByLabelText('Chip: Wildcard').textContent).toBe('WC');
    expect(screen.getByRole('link', { name: 'Alice Aces High' })).toHaveProperty(
      'hash',
      '#/players/1'
    );

    await fireEvent.click(screen.getByRole('button', { name: 'Score' }));

    expect(screen.getAllByRole('row')[1].textContent).toContain('Ben');
    expect(
      screen.getByRole('columnheader', { name: 'Score' }).getAttribute('aria-sort')
    ).toBe('ascending');
  });
});
