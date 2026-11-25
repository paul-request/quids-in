import { render, screen, within } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import type { PlannerTable } from '../utility/planner.interfaces';

import PlannerPage from './PlannerPage.svelte';

const participant = { id: 1, name: 'Alice', teamName: 'Aces High' };

function row(playerId: number, name: string, position: 1 | 4, difficulty: number) {
  return {
    cells: [
      { fixtures: [{ difficulty, home: true, opponent: 'MCI' }], gameweek: 12, points: 4.04 },
      { fixtures: [], gameweek: 13 },
    ],
    name,
    playerId,
    position,
    sum: 4.04,
    teamName: 'ARS',
  };
}

const table: PlannerTable = {
  bench: [row(3, 'Palmer', 1, 2)],
  bestCaptains: [
    { gameweek: 12, name: 'Haaland', points: 7.8 },
    { gameweek: 13, points: 0 },
  ],
  gameweeks: [12, 13],
  starters: [row(2, 'Haaland', 4, 5)],
  totalSum: 15.6,
  xiTotals: [15.6, 0],
};

describe('PlannerPage', () => {
  it('renders fixtures, projections, difficulty text, totals and best captain', () => {
    render(PlannerPage, {
      props: {
        participant,
        suggestions: [
          { candidates: [row(9, 'Isak', 4, 3)], position: 4, replace: row(2, 'Haaland', 4, 5) },
        ],
        table,
      },
    });

    const grid = screen.getByRole('table');

    expect(within(grid).getAllByText('MCI·H')).toHaveLength(2);
    expect(within(grid).getAllByText('4.0').length).toBeGreaterThan(0);
    expect(within(grid).getAllByText('Fixture difficulty 5 out of 5')).toHaveLength(1);
    expect(within(grid).getAllByText('No fixture')).toHaveLength(2);
    expect(within(grid).getByText('7.8')).toBeTruthy();
    expect(within(grid).getByText('16')).toBeTruthy();
    expect(screen.getByText('Transfer suggestions')).toBeTruthy();
    expect(screen.getByText('Isak')).toBeTruthy();
  });

  it('shows an unavailable state when there is no squad', () => {
    render(PlannerPage, { props: { participant, suggestions: [], table: undefined } });

    expect(screen.getByText('Squad planner unavailable')).toBeTruthy();
  });
});
