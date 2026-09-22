import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import AverageWeeklyPositionCard from './AverageWeeklyPositionCard.svelte';
import type {
  AverageWeeklyPositionRow,
  Participant,
} from '../utility/results.interfaces';

const participants: Array<Participant> = [
  { id: 1, name: 'Alice', teamName: 'Aces High' },
  { id: 2, name: 'Ben', teamName: 'Biscuit Boys' },
];

describe('AverageWeeklyPositionCard', () => {
  it('renders every participant with formatted average position and score', () => {
    const rows: Array<AverageWeeklyPositionRow> = [
      { participantId: 1, averagePosition: 1.5, averageWeeklyScore: 61 },
      { participantId: 2, averagePosition: 2, averageWeeklyScore: undefined },
    ];

    render(AverageWeeklyPositionCard, { props: { rows, participants } });

    expect(screen.getByRole('heading', { name: 'Weekly averages' })).toBeTruthy();

    const dataRows = screen.getAllByRole('row').slice(1);
    expect(dataRows[0].textContent).toContain('Alice');
    expect(dataRows[0].textContent).toContain('1.5');
    expect(dataRows[0].textContent).toContain('61');
    expect(dataRows[1].textContent).toContain('Ben');
    expect(dataRows[1].textContent).toContain('Unavailable');
  });

  it('shows an empty-state message when no averages are recorded', () => {
    render(AverageWeeklyPositionCard, { props: { rows: [], participants } });

    expect(screen.getByText('No weekly averages available yet.')).toBeTruthy();
  });

  it('toggles sort order between average position and average score', async () => {
    const rows: Array<AverageWeeklyPositionRow> = [
      { participantId: 1, averagePosition: 2, averageWeeklyScore: 40 },
      { participantId: 2, averagePosition: 1, averageWeeklyScore: 70 },
    ];

    render(AverageWeeklyPositionCard, { props: { rows, participants } });

    let dataRows = screen.getAllByRole('row').slice(1);
    expect(dataRows[0].textContent).toContain('Ben');

    await fireEvent.click(screen.getByRole('button', { name: 'Average score' }));

    dataRows = screen.getAllByRole('row').slice(1);
    expect(dataRows[0].textContent).toContain('Ben');

    await fireEvent.click(screen.getByRole('button', { name: 'Average score' }));

    dataRows = screen.getAllByRole('row').slice(1);
    expect(dataRows[0].textContent).toContain('Alice');
  });

  it('keeps the full heading wording available for the sort buttons', () => {
    const rows: Array<AverageWeeklyPositionRow> = [
      { participantId: 1, averagePosition: 1.5, averageWeeklyScore: 61 },
    ];

    render(AverageWeeklyPositionCard, { props: { rows, participants } });

    expect(screen.getByRole('button', { name: 'Average position' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Average score' })).toBeTruthy();
    expect(screen.getByText('Avg. pos.', { selector: '.label-abbr' })).toBeTruthy();
    expect(screen.getByText('Avg. score', { selector: '.label-abbr' })).toBeTruthy();
  });
});
