import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import historicalSeason from '../../../data/season-2025-26.json';
import type { Season } from '../utility/results.interfaces';

import App from './App.svelte';

function renderApp(seasonData: Season = historicalSeason): void {
  render(App, { props: { seasonData } });
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
      gameweek: 1,
      scores: {
        '1': { points: 20, transfers: 0, transferCost: 0 },
        '2': { points: 40, transfers: 0, transferCost: 0 },
      },
    },
    {
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

describe('App', () => {
  afterEach(() => {
    window.location.hash = '';
  });

  it('should render the dashboard current round and overall standings', () => {
    renderApp();

    expect(screen.getByRole('heading', { name: 'Gameweek 3' })).toBeTruthy();
    expect(screen.getByText(/🏆 Highest score:/)).toBeTruthy();
    expect(screen.getByText('Showing Gameweek 3 results.')).toBeTruthy();
    expect(document.querySelector('.winner-summary')?.textContent).toContain('(Daniel)');
    expect(document.querySelector('.lowest-score')?.textContent).toContain('(Leo)');
    expect(screen.getByRole('heading', { name: 'Overall standings' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Gameweek stats' })).toBeTruthy();
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

    expect(screen.getByText('-5')).toBeTruthy();

    await fireEvent.change(screen.getByRole('combobox', { name: 'Choose Gameweek' }), {
      target: { value: '1' },
    });

    expect(screen.getByText('+5')).toBeTruthy();
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
});
