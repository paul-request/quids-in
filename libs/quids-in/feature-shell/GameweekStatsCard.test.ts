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

  it('renders an explicit message when statistics are unavailable', () => {
    render(GameweekStatsCard, { props: { stats: { available: false } } });

    expect(
      screen.getByText('Gameweek statistics are unavailable because no usable scores were recorded.')
    ).toBeTruthy();
  });
});
