import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import GameweekStatsCard from './GameweekStatsCard.svelte';

describe('GameweekStatsCard', () => {
  it('renders every labelled statistic with formatted signed variance', () => {
    render(GameweekStatsCard, {
      props: {
        stats: {
          available: true,
          highestScore: 70,
          leagueAverage: 48.5,
          lowestScore: 33,
          spread: 37,
          varianceFromSeasonAverage: 2.25,
        },
      },
    });

    expect(screen.getByRole('region', { name: 'Gameweek stats' })).toBeTruthy();
    expect(screen.getByText('Highest score')).toBeTruthy();
    expect(screen.getByText('Lowest score')).toBeTruthy();
    expect(screen.getByText('League average')).toBeTruthy();
    expect(screen.getByText('Spread')).toBeTruthy();
    expect(screen.getByText('Variance from season average')).toBeTruthy();
    expect(screen.getByText('48.5')).toBeTruthy();
    expect(screen.getByText('+2.25')).toBeTruthy();
  });

  it('shows the FPL average and signed variance after the league average', () => {
    render(GameweekStatsCard, {
      props: {
        stats: {
          available: true,
          fplAverage: 59.8,
          highestScore: 70,
          leagueAverage: 56.6,
          lowestScore: 33,
          spread: 37,
          varianceFromFplAverage: -3.2,
          varianceFromSeasonAverage: 1,
        },
      },
    });

    const terms = Array.from(document.querySelectorAll('dt')).map((term) => term.textContent);

    expect(terms.slice(2, 5)).toEqual([
      'League average',
      'FPL average',
      'Variance from FPL average',
    ]);
    expect(screen.getByText('59.8')).toBeTruthy();
    expect(screen.getByText('-3.2')).toBeTruthy();
  });

  it('hides the FPL rows when no FPL average is recorded', () => {
    render(GameweekStatsCard, {
      props: {
        stats: {
          available: true,
          highestScore: 70,
          leagueAverage: 48.5,
          lowestScore: 33,
          spread: 37,
          varianceFromSeasonAverage: 2.25,
        },
      },
    });

    expect(screen.queryByText('FPL average')).toBeNull();
    expect(screen.queryByText('Variance from FPL average')).toBeNull();
    expect(document.querySelectorAll('dt')).toHaveLength(5);
  });

  it('renders an explicit message when statistics are unavailable', () => {
    render(GameweekStatsCard, { props: { stats: { available: false } } });

    expect(
      screen.getByText('Gameweek statistics are unavailable because no usable scores were recorded.')
    ).toBeTruthy();
  });
});
