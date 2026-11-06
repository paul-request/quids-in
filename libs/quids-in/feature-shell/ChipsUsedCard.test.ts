import { render, screen, within } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import { calculatePlayerChips } from '../utility/results';
import ChipsUsedCard from './ChipsUsedCard.svelte';

const participants = [{ id: 1, name: 'Alice', teamName: 'Aces High' }];

describe('ChipsUsedCard', () => {
  it('shows all eight unused chips in two labelled sets with blue-outline styling', () => {
    render(ChipsUsedCard, { props: { chips: calculatePlayerChips(participants, [], 1) } });

    expect(screen.getByRole('heading', { name: 'Chips used' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'First half (GW1-19)' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Second half (GW20-38)' })).toBeTruthy();
    expect(screen.getAllByRole('list')).toHaveLength(2);
    for (const name of ['Wildcard', 'Free Hit', 'Triple Captain', 'Bench Boost']) {
      expect(screen.getAllByText(name)).toHaveLength(2);
    }
    const badges = screen.getAllByRole('listitem');
    expect(badges).toHaveLength(8);
    for (const badge of badges) {
      expect(badge.classList.contains('chips-used__badge')).toBe(true);
      expect(badge.classList.contains('chips-used__badge--used')).toBe(false);
      expect(within(badge).getByText('Not used').classList.contains('visually-hidden')).toBe(true);
    }
  });

  it('marks each used chip green with its Gameweek and refreshes when usage changes', async () => {
    const chips = calculatePlayerChips(participants, [
      { gameweek: 19, scores: { '1': { chip: 'wildcard', points: 50, transfers: 0, transferCost: 0 } } },
      { gameweek: 20, scores: { '1': { chip: 'wildcard', points: 50, transfers: 0, transferCost: 0 } } },
    ], 1);
    const { rerender } = render(ChipsUsedCard, { props: { chips } });

    for (const gameweek of [19, 20]) {
      const badge = screen.getByText(`Used GW${gameweek}`).closest('li');
      expect(badge?.classList.contains('chips-used__badge--used')).toBe(true);
      expect(badge?.textContent).toContain('Wildcard');
      expect(screen.getByText(`Used GW${gameweek}`).classList.contains('visually-hidden')).toBe(false);
    }
    expect(screen.getAllByText('Not used')).toHaveLength(6);

    await rerender({ chips: calculatePlayerChips(participants, [], 1) });

    expect(screen.queryByText('Used GW20')).toBeNull();
    expect(screen.getAllByText('Not used')).toHaveLength(8);
  });
});
