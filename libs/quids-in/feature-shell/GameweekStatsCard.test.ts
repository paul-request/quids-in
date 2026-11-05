import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import GameweekStatsCard from './GameweekStatsCard.svelte';

const cardProps = {
  gameweek: 3,
  participants: [
    { id: 1, name: 'Alice', teamName: 'Aces High' },
    { id: 2, name: 'Ben', teamName: 'Biscuit Boys' },
  ],
  result: {
    highestScore: 70,
    lowestScore: 33,
    winners: [{ participantId: 1, winShare: 1 }],
    lastPlaceParticipantIds: [2],
  },
};

describe('GameweekStatsCard', () => {
  it('renders every labelled statistic with formatted signed difference', () => {
    render(GameweekStatsCard, {
      props: {
        ...cardProps,
        stats: {
          available: true,
          highestScore: 70,
          leagueAverage: 48.5,
          lowestScore: 33,
          spread: 37,
          differenceFromSeasonAverage: 2.25,
        },
      },
    });

    const region = screen.getByRole('region', { name: 'Gameweek 3 stats' });

    expect(region.querySelector('.winner-summary')?.textContent).toContain(
      'Highest score: 70 (Alice).'
    );
    expect(region.querySelector('.lowest-score')?.textContent).toContain('Lowest score: 33 (Ben).');
    expect(screen.getByText('League average')).toBeTruthy();
    expect(screen.getByText('Spread')).toBeTruthy();
    expect(screen.getByText('Difference from season average')).toBeTruthy();
    expect(screen.getByText('48.5')).toBeTruthy();
    expect(screen.getByText('+2.25')).toBeTruthy();
  });

  it('shows the FPL average and signed difference after the league average', () => {
    render(GameweekStatsCard, {
      props: {
        ...cardProps,
        stats: {
          available: true,
          fplAverage: 59.8,
          highestScore: 70,
          leagueAverage: 56.6,
          lowestScore: 33,
          spread: 37,
          differenceFromFplAverage: -3.2,
          differenceFromSeasonAverage: 1,
        },
      },
    });

    const terms = Array.from(document.querySelectorAll('dt')).map((term) => term.textContent);

    expect(terms.slice(0, 3)).toEqual([
      'League average',
      'FPL average',
      'Difference from FPL average',
    ]);
    expect(screen.getByText('59.8')).toBeTruthy();
    expect(screen.getByText('-3.2')).toBeTruthy();
  });

  it('hides the FPL rows when no FPL average is recorded', () => {
    render(GameweekStatsCard, {
      props: {
        ...cardProps,
        stats: {
          available: true,
          highestScore: 70,
          leagueAverage: 48.5,
          lowestScore: 33,
          spread: 37,
          differenceFromSeasonAverage: 2.25,
        },
      },
    });

    expect(screen.queryByText('FPL average')).toBeNull();
    expect(screen.queryByText('Difference from FPL average')).toBeNull();
    expect(document.querySelectorAll('dt')).toHaveLength(3);
  });

  it('hides the season comparison when no completed baseline is available', () => {
    render(GameweekStatsCard, {
      props: {
        ...cardProps,
        stats: {
          available: true,
          highestScore: 70,
          leagueAverage: 48.5,
          lowestScore: 33,
          spread: 37,
        },
      },
    });

    expect(screen.queryByText('Difference from season average')).toBeNull();
  });

  it('renders an explicit message when statistics are unavailable', () => {
    render(GameweekStatsCard, {
      props: { ...cardProps, stats: { available: false } },
    });

    expect(
      screen.getByText(
        'Gameweek statistics are unavailable because no usable scores were recorded.'
      )
    ).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Gameweek 3 stats' })).toBeTruthy();
  });
});
