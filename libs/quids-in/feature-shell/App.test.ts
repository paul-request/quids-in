import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import historicalSeason from '../../../data/season-2025-26.json';
import type { CupDrawFile } from '../utility/cups.interfaces';
import type { Season } from '../utility/results.interfaces';

import App from './App.svelte';

const completedHistoricalSeason: Season = {
  ...historicalSeason,
  gameweeks: historicalSeason.gameweeks.map((gameweek) => ({ ...gameweek, ended: true })),
};

function renderApp(seasonData: Season = completedHistoricalSeason, cupDraw?: CupDrawFile): void {
  render(App, { props: cupDraw ? { cupDraw, seasonData } : { seasonData } });
}

const emptySeason: Season = {
  gameweeks: [],
  participants: [
    { id: 1, name: 'Alice', teamName: 'Aces High' },
    { id: 2, name: 'Ben', teamName: 'Biscuit Boys' },
  ],
  season: '2025-26',
};

const statsSeason: Season = {
  gameweeks: [
    {
      ended: true,
      gameweek: 1,
      scores: {
        '1': { points: 20, transfers: 0, transferCost: 0 },
        '2': { points: 40, transfers: 0, transferCost: 0 },
      },
    },
    {
      ended: true,
      gameweek: 2,
      scores: {
        '1': { points: 10, transfers: 0, transferCost: 0, squadValue: 1005, bank: 5 },
        '2': { points: 30, transfers: 0, transferCost: 0 },
      },
    },
  ],
  participants: [
    { id: 1, name: 'Alice', teamName: 'Aces High' },
    { id: 2, name: 'Ben', teamName: 'Biscuit Boys' },
  ],
  season: '2025-26',
};

const cupDraw: CupDrawFile = {
  cups: [
    {
      id: 'quids-in-cup',
      name: 'Quids In Cup',
      revealAfterGameweek: 2,
      round1Fixtures: [{ fixture: 1, participantIds: [1, 2] }],
      startGameweek: 3,
    },
  ],
  generatedAt: '2026-09-29T00:00:00.000Z',
  season: '2025-26',
};

describe('App', () => {
  afterEach(() => {
    window.location.hash = '';
  });

  it('shows chip usage on the player route even before the first score is completed', () => {
    window.location.hash = '#/players/1';
    renderApp({
      ...statsSeason,
      gameweeks: [{
        ended: false,
        gameweek: 1,
        scores: {
          '1': { points: 20, transfers: 0, transferCost: 0, chip: 'bboost' },
          '2': { points: 40, transfers: 0, transferCost: 0, chip: 'wildcard' },
        },
      }],
    });

    expect(screen.getByRole('heading', { name: 'No recorded scores for Alice' })).toBeTruthy();
    const card = screen.getByRole('region', { name: 'Chips used' });
    expect(within(card).getAllByRole('listitem')).toHaveLength(8);
    expect(within(card).getByText('Used GW1').closest('li')?.textContent).toContain('Bench Boost');
    expect(within(card).getAllByText('Not used')).toHaveLength(7);
  });

  it('shows chips from both halves of the season on a completed player route', () => {
    window.location.hash = '#/players/1';
    renderApp({
      ...statsSeason,
      gameweeks: [
        { ended: true, gameweek: 19, scores: { '1': { points: 20, transfers: 0, transferCost: 0, chip: 'freehit' } } },
        { ended: true, gameweek: 20, scores: { '1': { points: 40, transfers: 0, transferCost: 0, chip: '3xc' } } },
      ],
    });

    expect(screen.getByRole('heading', { name: 'Alice' })).toBeTruthy();
    const card = screen.getByRole('region', { name: 'Chips used' });
    expect(within(card).getByText('Used GW19').closest('li')?.textContent).toContain('Free Hit');
    expect(within(card).getByText('Used GW20').closest('li')?.textContent).toContain('Triple Captain');
    expect(within(card).getAllByText('Not used')).toHaveLength(6);
  });

  it.each([
    ['before the deadline', false, false, false],
    ['live', true, false, true],
    ['finished but unchecked', true, false, true],
    ['finished and checked', true, true, false],
    ['unknown start', undefined, false, false],
    ['unknown completion', true, undefined, false],
    ['legacy snapshot', undefined, undefined, false],
  ])('shows the correct badge for a %s Gameweek', (_label, started, ended, visible) => {
    const seasonData: Season = {
      ...statsSeason,
      gameweeks: statsSeason.gameweeks.map((gameweek) => ({ ...gameweek, ended, started })),
    };

    renderApp(seasonData);

    expect(screen.queryByText('In progress') !== null).toBe(visible);
    expect(screen.getByRole('heading', { name: 'Gameweek 2' })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Choose Gameweek' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Gameweek 2 (current)' })).toBeTruthy();
    expect(document.querySelector('.winner-summary')?.textContent).toContain('(Ben)');
    expect(screen.getByRole('heading', { name: 'Profit & loss' })).toBeTruthy();
  });

  it('shows the badge beside the heading only and updates it on selection', async () => {
    renderApp({
      ...statsSeason,
      gameweeks: statsSeason.gameweeks.map((gameweek) => ({
        ...gameweek,
        ended: false,
        started: true,
      })),
    });

    const badge = screen.getByText('In progress');

    expect(badge.parentElement?.querySelector('h1')?.textContent).toBe('Gameweek 2');
    expect(badge.tagName).toBe('SPAN');
    expect(badge.hasAttribute('tabindex')).toBe(false);
    expect(screen.getAllByText('In progress')).toHaveLength(1);

    await fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });

    expect(screen.queryByText('In progress')).toBeNull();

    await fireEvent.change(screen.getByRole('combobox'), { target: { value: '2' } });

    expect(screen.getByText('In progress')).toBeTruthy();
  });

  it('removes the badge when refreshed snapshot props mark the round complete', async () => {
    const liveSeason: Season = {
      ...statsSeason,
      gameweeks: statsSeason.gameweeks.map((gameweek) => ({
        ...gameweek,
        ended: false,
        started: true,
      })),
    };
    const { rerender } = render(App, { props: { seasonData: liveSeason } });

    expect(screen.getByText('In progress')).toBeTruthy();

    await rerender({
      seasonData: {
        ...liveSeason,
        gameweeks: liveSeason.gameweeks.map((gameweek) => ({ ...gameweek, ended: true })),
      },
    });

    expect(screen.queryByText('In progress')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Gameweek 2' })).toBeTruthy();
  });

  it('does not show the badge for an empty season', () => {
    renderApp(emptySeason);

    expect(screen.queryByText('In progress')).toBeNull();
    expect(screen.getByRole('heading', { name: 'No Gameweek results yet' })).toBeTruthy();
  });

  it('should render the dashboard current round and overall standings', () => {
    renderApp();

    expect(screen.getByRole('heading', { name: 'Gameweek 3' })).toBeTruthy();
    const gameweekStats = screen.getByRole('region', { name: 'Gameweek 3 stats' });

    expect(within(gameweekStats).getByText(/Highest score:/)).toBeTruthy();
    expect(within(gameweekStats).getByText(/Lowest score:/)).toBeTruthy();
    expect(screen.getByText('Showing Gameweek 3 results.')).toBeTruthy();
    expect(gameweekStats.querySelector('.winner-summary')?.textContent).toContain('(Daniel)');
    expect(gameweekStats.querySelector('.lowest-score')?.textContent).toContain('(Leo)');
    expect(document.querySelector('.gameweek-card .winner-summary')).toBeNull();
    expect(document.querySelector('.gameweek-card .lowest-score')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Overall standings' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'The slugs' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Losses' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Weekly averages' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Profit & loss' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Season balance' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Weekly balance' })).toBeTruthy();
    expect(screen.getAllByRole('link', { name: 'Daniel Dazzle United' }).length).toBeGreaterThan(0);
  });

  it('should render fractional standings and a Gameweek selector', () => {
    renderApp();

    expect(screen.getAllByRole('cell', { name: '0.5' })).toHaveLength(2);
    expect(screen.getByRole('combobox', { name: 'Choose Gameweek' })).toBeTruthy();
    expect(screen.queryByText('Browse Gameweeks')).toBeNull();
    expect(screen.queryByText('View round details')).toBeNull();
  });

  it('should order selected Gameweek scores and show tied standing positions', () => {
    renderApp();

    const scoreRows = screen.getAllByRole('table')[0].querySelectorAll('tbody tr');
    const standingRows = screen.getAllByRole('table')[1].querySelectorAll('tbody tr');

    expect(scoreRows[0].textContent).toContain('Daniel');
    expect(scoreRows[1].textContent).toContain('Alice');
    expect(standingRows[0].firstElementChild?.textContent).toBe('1');
    expect(standingRows[1].firstElementChild?.textContent).toBe('=');
    expect(standingRows[2].firstElementChild?.textContent).toBe('3');
    expect(standingRows[3].firstElementChild?.textContent).toBe('=');
    expect(standingRows[4].firstElementChild?.textContent).toBe('5');
  });

  it('should change the displayed Gameweek when selected', async () => {
    renderApp();

    await fireEvent.change(screen.getByRole('combobox', { name: 'Choose Gameweek' }), {
      target: { value: '2' },
    });

    expect(screen.getByRole('heading', { name: 'Gameweek 2' })).toBeTruthy();
    expect(screen.getByText('Showing Gameweek 2 results.')).toBeTruthy();
    expect(screen.getAllByText('Winner', { selector: '.badge-label' })).toHaveLength(2);
    expect(screen.getByText('Slug', { selector: '.badge-label' })).toBeTruthy();
  });

  it('should update Gameweek stats when the selected Gameweek changes', async () => {
    renderApp(statsSeason);

    let gameweekStats = screen.getByRole('region', { name: 'Gameweek 2 stats' });

    expect(screen.getByText('-5')).toBeTruthy();
    expect(gameweekStats.querySelector('.winner-summary')?.textContent).toContain('30 (Ben)');
    expect(gameweekStats.querySelector('.lowest-score')?.textContent).toContain('10 (Alice)');

    await fireEvent.change(screen.getByRole('combobox', { name: 'Choose Gameweek' }), {
      target: { value: '1' },
    });

    gameweekStats = screen.getByRole('region', { name: 'Gameweek 1 stats' });

    expect(screen.getByText('+5')).toBeTruthy();
    expect(gameweekStats.querySelector('.winner-summary')?.textContent).toContain('40 (Ben)');
    expect(gameweekStats.querySelector('.lowest-score')?.textContent).toContain('20 (Alice)');
  });

  it('keeps season summaries unchanged for live scores and includes them after completion', async () => {
    const seasonData: Season = {
      gameweeks: [
        {
          ended: true,
          gameweek: 1,
          scores: {
            '1': { points: 60, transfers: 0, transferCost: 0 },
            '2': { points: 40, transfers: 0, transferCost: 0 },
          },
        },
        {
          ended: false,
          gameweek: 2,
          scores: {
            '1': { points: 10, transfers: 0, transferCost: 0 },
            '2': { points: 80, transfers: 0, transferCost: 0 },
          },
        },
      ],
      participants: statsSeason.participants,
      season: '2025-26',
    };
    const { rerender } = render(App, { props: { seasonData } });

    const getWins = (name: string): string | null => {
      const row = within(screen.getByRole('region', { name: 'Overall standings' }))
        .getByRole('link', { name })
        .closest('tr');

      return row?.querySelectorAll('td')[1]?.textContent ?? null;
    };
    const getBalance = (name: string): string | null => {
      const row = within(screen.getByRole('region', { name: 'Profit & loss' }))
        .getByRole('link', { name })
        .closest('tr');

      return row?.querySelectorAll('td')[0]?.textContent?.trim() ?? null;
    };

    expect(document.querySelector('.winner-summary')?.textContent).toContain('(Ben)');
    expect(getWins('Alice Aces High')).toBe('1');
    expect(getWins('Ben Biscuit Boys')).toBe('0');
    expect(getBalance('Alice Aces High')).toBe('-£36.00');

    const changedLiveSeason: Season = {
      ...seasonData,
      gameweeks: seasonData.gameweeks.map((gameweek) =>
        gameweek.gameweek === 2
          ? {
              ...gameweek,
              scores: {
                '1': { points: 100, transfers: 0, transferCost: 0 },
                '2': { points: 0, transfers: 0, transferCost: 0 },
              },
            }
          : gameweek
      ),
    };
    await rerender({ seasonData: changedLiveSeason });

    expect(document.querySelector('.winner-summary')?.textContent).toContain('(Alice)');
    expect(getWins('Alice Aces High')).toBe('1');
    expect(getWins('Ben Biscuit Boys')).toBe('0');
    expect(getBalance('Alice Aces High')).toBe('-£36.00');

    await rerender({
      seasonData: {
        ...changedLiveSeason,
        gameweeks: changedLiveSeason.gameweeks.map((gameweek) => ({
          ...gameweek,
          ended: true,
        })),
      },
    });

    expect(getWins('Alice Aces High')).toBe('2');
    expect(getWins('Ben Biscuit Boys')).toBe('0');
    expect(getBalance('Alice Aces High')).toBe('-£34.00');
  });

  it('omits the season-stat comparison when the snapshot has no completed baseline', () => {
    renderApp({
      ...statsSeason,
      gameweeks: statsSeason.gameweeks.map((gameweek) => ({ ...gameweek, ended: undefined })),
    });

    expect(screen.queryByText('Difference from season average')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Gameweek 2' })).toBeTruthy();
  });

  it('does not show live scores as player stats on a direct route and keeps the latest Team value', () => {
    window.location.hash = '#/players/1';
    renderApp({
      ...statsSeason,
      gameweeks: [
        {
          ended: false,
          gameweek: 2,
          scores: {
            '1': {
              points: 100,
              transfers: 2,
              transferCost: 4,
              squadValue: 1010,
              bank: 5,
            },
            '2': { points: 80, transfers: 0, transferCost: 0 },
          },
        },
      ],
    });

    expect(screen.getByRole('heading', { name: 'No recorded scores for Alice' })).toBeTruthy();
    expect(screen.getByText('£101.5m')).toBeTruthy();
    expect(screen.getByText('-£38.00')).toBeTruthy();
    expect(screen.queryByText('Total points')).toBeNull();
  });

  it('should toggle summary-card numeric sorting from their headings', async () => {
    renderApp();

    const sortingButtons = [
      'Position',
      'Wins',
      'Losses',
      'Average position',
      'Average score',
      'Season balance',
      'Weekly balance',
    ];

    for (const name of sortingButtons) {
      const button = screen.getByRole('button', { name });

      await fireEvent.click(button);

      expect(button.parentElement?.getAttribute('aria-sort')).not.toBeNull();
    }
  });

  it('should render zero-win standings and no-results content for an empty season', () => {
    renderApp(emptySeason);

    expect(screen.getByRole('heading', { name: 'No Gameweek results yet' })).toBeTruthy();
    expect(screen.getAllByRole('table')).toHaveLength(3);
    expect(screen.getAllByRole('cell', { name: '0' })).toHaveLength(2);
    expect(screen.getByText('No weekly averages available yet.')).toBeTruthy();
    expect(screen.getAllByRole('cell', { name: '-£38.00' })).toHaveLength(2);
  });

  it('should show when the data was last refreshed if the season has a source', () => {
    renderApp({ ...statsSeason, source: { leagueId: 1, retrievedAt: '2026-09-22T13:01:59.555Z' } });

    expect(screen.getByText(/Data last refreshed:/)).toBeTruthy();
  });

  it('should not show a last-refreshed timestamp when the season has no source', () => {
    renderApp(statsSeason);

    expect(screen.queryByText(/Data last refreshed:/)).toBeNull();
  });

  it('should open Player stats from the combined player/team link and return to the dashboard', async () => {
    window.location.hash = '#/';
    renderApp(statsSeason);

    window.location.hash = '#/players/1';
    await fireEvent(window, new HashChangeEvent('hashchange'));

    expect(screen.getByRole('heading', { name: 'Alice' })).toBeTruthy();
    expect(screen.getByText('Total points')).toBeTruthy();
    expect(screen.getByText('-£38.00')).toBeTruthy();
    expect(screen.getByText('Team value')).toBeTruthy();
    expect(screen.getByText('£101m')).toBeTruthy();

    window.location.hash = '#/';
    await fireEvent(window, new HashChangeEvent('hashchange'));

    expect(screen.getByRole('heading', { name: 'Gameweek 2' })).toBeTruthy();
  });

  it('should show an explicit state for an unknown Player stats route', () => {
    window.location.hash = '#/players/999';
    renderApp(statsSeason);

    expect(screen.getByRole('heading', { name: 'Player stats unavailable' })).toBeTruthy();
  });

  it('should link to the cups and show hidden pairings until the reveal Gameweek ends', async () => {
    window.location.hash = '#/';
    renderApp(
      {
        ...statsSeason,
        gameweeks: statsSeason.gameweeks.map((gameweek) =>
          gameweek.gameweek === 2 ? { ...gameweek, ended: false } : gameweek
        ),
      },
      cupDraw
    );

    const cupsLink = screen.getByRole('link', { name: 'Cups' });

    expect(cupsLink.getAttribute('href')).toBe('#/cups');

    window.location.hash = '#/cups';
    await fireEvent(window, new HashChangeEvent('hashchange'));

    expect(screen.getByRole('heading', { level: 1, name: 'Cups' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'quids-in home' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Quids In Cup' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'FPL League Cup' })).toBeTruthy();
    expect(
      Array.from(document.querySelectorAll('.cup-bracket__meta')).map((node) =>
        node.textContent?.replace(/\s+/g, ' ').trim()
      )
    ).toContain('Begins Gameweek 3 (Revealed after gameweek 2)');
    expect(
      Array.from(document.querySelectorAll('.cup-bracket__meta')).map((node) =>
        node.textContent?.replace(/\s+/g, ' ').trim()
      )
    ).toContain('Begins Gameweek 35 (Draw not yet made)');
    expect(screen.queryByRole('link', { name: 'Alice Aces High' })).toBeNull();

    await fireEvent.click(screen.getByRole('link', { name: 'Dashboard' }));
    window.location.hash = '#/';
    await fireEvent(window, new HashChangeEvent('hashchange'));

    expect(screen.getByRole('heading', { name: 'Gameweek 2' })).toBeTruthy();
  });

  it('should reveal cup pairings once the reveal Gameweek has ended', () => {
    window.location.hash = '#/cups';
    renderApp(
      {
        ...statsSeason,
        gameweeks: statsSeason.gameweeks.map((gameweek) => ({ ...gameweek, ended: true })),
      },
      cupDraw
    );

    expect(screen.getByRole('link', { name: 'Alice Aces High' })).toBeTruthy();
    expect(screen.getByText(/^Begins Gameweek 3$/)).toBeTruthy();
  });

  it('should include the cup entry fees in the season balance', () => {
    renderApp(statsSeason, cupDraw);

    expect(screen.getAllByRole('cell', { name: '-£40.00' })).toHaveLength(1);
  });

  it('should hide the cups link for a season without a cup draw', () => {
    renderApp(statsSeason);

    expect(screen.queryByRole('link', { name: 'Cups' })).toBeNull();
  });
});
