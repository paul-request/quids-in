import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import PlayerStats from './PlayerStats.svelte';

describe('PlayerStats', () => {
  it('renders score, position, and profit/loss statistics', () => {
    render(PlayerStats, {
      props: {
        participant: { id: 1, name: 'Alice', teamName: 'Aces High' },
        balance: undefined,
        teamValue: { available: true, teamValueTenthsOfMillion: 1015 },
        stats: {
          averageLeaguePosition: 1.5,
          averageWeeklyScore: 50.5,
          currentBalancePennies: -100,
          highestScore: 70,
          highestScoreGameweeks: [2, 4],
          lowestScore: 31,
          lowestScoreGameweeks: [1],
          participant: { id: 1, name: 'Alice', teamName: 'Aces High' },
          seasonBalancePennies: -3500,
          totalTransfers: 3,
          totalPoints: 101,
        },
      },
    });

    expect(screen.getByRole('heading', { name: 'Alice' })).toBeTruthy();
    expect(screen.getByText('70 (Gameweeks 2, 4)')).toBeTruthy();
    expect(screen.getByText('Total transfers made')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('-£35.00')).toBeTruthy();
    expect(screen.getByText('-£1.00')).toBeTruthy();
    expect(screen.getByText('Team value')).toBeTruthy();
    expect(screen.getByText('£101.5m')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Back to dashboard' })).toHaveProperty('hash', '#/');
  });

  it('renders an explicit unavailable label when team value has not been recorded', () => {
    render(PlayerStats, {
      props: {
        participant: { id: 1, name: 'Alice', teamName: 'Aces High' },
        balance: undefined,
        teamValue: { available: false },
        stats: {
          averageLeaguePosition: 1.5,
          averageWeeklyScore: 50.5,
          currentBalancePennies: -100,
          highestScore: 70,
          highestScoreGameweeks: [2, 4],
          lowestScore: 31,
          lowestScoreGameweeks: [1],
          participant: { id: 1, name: 'Alice', teamName: 'Aces High' },
          seasonBalancePennies: -3500,
          totalTransfers: 3,
          totalPoints: 101,
        },
      },
    });

    expect(screen.getByText('Team value')).toBeTruthy();
    expect(screen.getByText('Not available')).toBeTruthy();
  });

  it('renders an explicit no-recorded-score state for known players', () => {
    render(PlayerStats, {
      props: {
        participant: { id: 1, name: 'Alice', teamName: 'Aces High' },
        balance: {
          participantId: 1,
          grossWinningsPennies: 0,
          netBalancePennies: -3800,
          weeklyBalancePennies: 0,
        },
        teamValue: { available: false },
        stats: undefined,
      },
    });

    expect(screen.getByRole('heading', { name: 'No recorded scores for Alice' })).toBeTruthy();
    expect(screen.getByText('-£38.00')).toBeTruthy();
    expect(screen.getByText('Team value')).toBeTruthy();
    expect(screen.getByText('Not available')).toBeTruthy();
  });
});
