import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import BiggestSlugsCard from './BiggestSlugsCard.svelte';
import type { BiggestSlugRow, Participant } from '../utility/results.interfaces';

const participants: Array<Participant> = [
  { id: 1, name: 'Alice', teamName: 'Aces High' },
  { id: 2, name: 'Ben', teamName: 'Biscuit Boys' },
];

describe('BiggestSlugsCard', () => {
  it('renders a row per participant with recorded losses, ranked by losses', () => {
    const rows: Array<BiggestSlugRow> = [
      { participantId: 2, weeklyLosses: 1 },
      { participantId: 1, weeklyLosses: 3 },
    ];

    render(BiggestSlugsCard, { props: { rows, participants } });

    expect(screen.getByRole('heading', { name: 'The slugs' })).toBeTruthy();

    const dataRows = screen.getAllByRole('row').slice(1);
    expect(dataRows[0].textContent).toContain('Alice');
    expect(dataRows[0].textContent).toContain('3');
    expect(dataRows[1].textContent).toContain('Ben');
    expect(dataRows[1].textContent).toContain('1');
  });

  it('renders no rows when nobody has recorded losses', () => {
    render(BiggestSlugsCard, { props: { rows: [], participants } });

    expect(screen.getAllByRole('row')).toHaveLength(1);
  });

  it('toggles losses sort order when the column heading is activated', async () => {
    const rows: Array<BiggestSlugRow> = [
      { participantId: 1, weeklyLosses: 1 },
      { participantId: 2, weeklyLosses: 3 },
    ];

    render(BiggestSlugsCard, { props: { rows, participants } });

    let dataRows = screen.getAllByRole('row').slice(1);
    expect(dataRows[0].textContent).toContain('Ben');

    await fireEvent.click(screen.getByRole('button', { name: 'Losses' }));

    dataRows = screen.getAllByRole('row').slice(1);
    expect(dataRows[0].textContent).toContain('Alice');
  });
});
