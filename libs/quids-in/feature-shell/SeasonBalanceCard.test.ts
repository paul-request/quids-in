import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import SeasonBalanceCard from './SeasonBalanceCard.svelte';
import type { Participant, SeasonBalanceRow } from '../utility/results.interfaces';

const participants: Array<Participant> = [
  { id: 1, name: 'Alice', teamName: 'Aces High' },
  { id: 2, name: 'Ben', teamName: 'Biscuit Boys' },
];

describe('SeasonBalanceCard', () => {
  it('renders every participant with formatted season and weekly balances', () => {
    const rows: Array<SeasonBalanceRow> = [
      { participantId: 1, grossWinningsPennies: 300, netBalancePennies: -3500, weeklyBalancePennies: 200 },
      { participantId: 2, grossWinningsPennies: 0, netBalancePennies: -3800, weeklyBalancePennies: -100 },
    ];

    render(SeasonBalanceCard, { props: { rows, participants } });

    expect(screen.getByRole('heading', { name: 'Profit & loss' })).toBeTruthy();

    const dataRows = screen.getAllByRole('row').slice(1);
    expect(dataRows[0].textContent).toContain('Alice');
    expect(dataRows[0].textContent).toContain('-£35.00');
    expect(dataRows[0].textContent).toContain('£2.00');
    expect(dataRows[1].textContent).toContain('Ben');
    expect(dataRows[1].textContent).toContain('-£38.00');
    expect(dataRows[1].textContent).toContain('-£1.00');
  });

  it('renders a -£38.00 balance for every participant in an empty season', () => {
    const rows: Array<SeasonBalanceRow> = [
      { participantId: 1, grossWinningsPennies: 0, netBalancePennies: -3800, weeklyBalancePennies: 0 },
      { participantId: 2, grossWinningsPennies: 0, netBalancePennies: -3800, weeklyBalancePennies: 0 },
    ];

    render(SeasonBalanceCard, { props: { rows, participants } });

    const dataRows = screen.getAllByRole('row').slice(1);
    expect(dataRows[0].textContent).toContain('-£38.00');
    expect(dataRows[1].textContent).toContain('-£38.00');
  });

  it('toggles sort order between season and weekly balance', async () => {
    const rows: Array<SeasonBalanceRow> = [
      { participantId: 1, grossWinningsPennies: 100, netBalancePennies: -3700, weeklyBalancePennies: 100 },
      { participantId: 2, grossWinningsPennies: 300, netBalancePennies: -3500, weeklyBalancePennies: -50 },
    ];

    render(SeasonBalanceCard, { props: { rows, participants } });

    let dataRows = screen.getAllByRole('row').slice(1);
    expect(dataRows[0].textContent).toContain('Ben');

    await fireEvent.click(screen.getByRole('button', { name: 'Weekly balance' }));

    dataRows = screen.getAllByRole('row').slice(1);
    expect(dataRows[0].textContent).toContain('Alice');
  });

  it('keeps the full heading wording available for the sort buttons', () => {
    const rows: Array<SeasonBalanceRow> = [];

    render(SeasonBalanceCard, { props: { rows, participants } });

    expect(screen.getByRole('button', { name: 'Season balance' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Weekly balance' })).toBeTruthy();
    expect(screen.getByText('Season', { selector: '.label-abbr' })).toBeTruthy();
    expect(screen.getByText('Weekly', { selector: '.label-abbr' })).toBeTruthy();
  });
});
