import { render, screen, within } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import type { CupBracket } from '../utility/cups.interfaces';
import type { Participant } from '../utility/results.interfaces';

import CupsPage from './CupsPage.svelte';

const participants: Array<Participant> = [
  { id: 1, name: 'Alice', teamName: 'Aces High' },
  { id: 2, name: 'Ben', teamName: 'Biscuit Boys' },
  { id: 3, name: 'Chloe', teamName: 'Chilli Chasers' },
];
const participantsById = new Map(participants.map((participant) => [participant.id, participant]));

function bracket(overrides: Partial<CupBracket>): CupBracket {
  return {
    drawAvailable: true,
    id: 'quids-in-cup',
    name: 'Quids In Cup',
    revealAfterGameweek: 9,
    revealed: true,
    rounds: [],
    startGameweek: 10,
    ...overrides,
  };
}

const obfuscatedCup = bracket({
  revealed: false,
  rounds: [
    {
      gameweek: 10,
      name: 'Semi-final',
      ties: [
        {
          label: 'Semi-final 1',
          slots: [
            { kind: 'participant', obfuscated: true, participantId: 1 },
            { kind: 'participant', obfuscated: true, participantId: 2 },
          ],
          status: 'obfuscated',
        },
        {
          label: 'Semi-final 2',
          slots: [
            { kind: 'participant', obfuscated: true, participantId: 3 },
            { kind: 'bye', obfuscated: true },
          ],
          status: 'obfuscated',
        },
      ],
    },
    {
      gameweek: 11,
      name: 'Final',
      ties: [
        {
          label: 'Final',
          slots: [
            { kind: 'winner-of', tieLabel: 'Semi-final 1' },
            { kind: 'winner-of', tieLabel: 'Semi-final 2' },
          ],
          status: 'scheduled',
        },
      ],
    },
  ],
});

const revealedCup = bracket({
  championParticipantId: 1,
  rounds: [
    {
      gameweek: 10,
      name: 'Semi-final',
      ties: [
        {
          label: 'Semi-final 1',
          slots: [
            { kind: 'participant', obfuscated: false, participantId: 1, score: 50 },
            { kind: 'participant', obfuscated: false, participantId: 2, score: 50 },
          ],
          status: 'decided',
          tieBreak: 'goals-scored',
          winnerParticipantId: 1,
        },
        {
          label: 'Semi-final 2',
          slots: [
            { kind: 'participant', obfuscated: false, participantId: 3 },
            { kind: 'bye', obfuscated: false },
          ],
          status: 'walkover',
          winnerParticipantId: 3,
        },
      ],
    },
    {
      gameweek: 11,
      name: 'Final',
      ties: [
        {
          label: 'Final',
          slots: [
            { kind: 'participant', obfuscated: false, participantId: 1, score: 70 },
            { kind: 'participant', obfuscated: false, participantId: 3, score: 60 },
          ],
          status: 'decided',
          winnerParticipantId: 1,
        },
      ],
    },
  ],
});

function renderCups(cups: Array<CupBracket>, latestGameweek: number | undefined = 5): void {
  render(CupsPage, { props: { cups, latestGameweek, participantsById } });
}

describe('CupsPage', () => {
  it('links back to the dashboard and renders a section per cup', () => {
    renderCups([revealedCup, bracket({ id: 'fpl-league-cup', name: 'FPL League Cup' })]);

    expect(screen.getByRole('link', { name: 'quids-in home' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Dashboard' }).getAttribute('href')).toBe('#/');
    expect(screen.getByRole('heading', { level: 1, name: 'Cups' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Quids In Cup' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'FPL League Cup' })).toBeTruthy();
  });

  it('blurs Round 1 names without links or scores and gives a text alternative', () => {
    renderCups([obfuscatedCup]);

    expect(
      Array.from(document.querySelectorAll('.cup-bracket__meta')).map((node) =>
        node.textContent?.replace(/\s+/g, ' ').trim()
      )
    ).toContain('Begins Gameweek 10 (Revealed after gameweek 9)');
    expect(screen.queryByRole('link', { name: /Alice/ })).toBeNull();
    expect(screen.getAllByText('Hidden until Gameweek 9 ends')).toHaveLength(4);

    const obfuscated = document.querySelectorAll('.cup-slot__obfuscated');

    expect(obfuscated).toHaveLength(4);
    obfuscated.forEach((element) => expect(element.getAttribute('aria-hidden')).toBe('true'));
    expect(obfuscated[0].textContent).toContain('Alice');
    expect(obfuscated[3].textContent).toBe('Bye');
    expect(document.querySelector('.cup-slot__score')).toBeNull();
    expect(screen.getByText('Winner of Semi-final 1')).toBeTruthy();
    expect(screen.getByText('Winner of Semi-final 2')).toBeTruthy();
  });

  it('shows revealed links, scores, byes, tie-break reasons, and the champion', () => {
    renderCups([revealedCup], 11);

    expect(screen.getAllByRole('link', { name: 'Alice Aces High' })).toHaveLength(2);
    expect(screen.getByText('Bye')).toBeTruthy();
    expect(screen.getByText('Level on points: won on most goals scored')).toBeTruthy();
    expect(screen.getByText('🏆 Alice')).toBeTruthy();
    expect(document.querySelector('.cup-bracket__meta')?.textContent).toContain(
      'Begins Gameweek 10'
    );

    const final = screen.getByText('Final', { selector: '.cup-tie__label' }).closest('li');

    expect(within(final as HTMLElement).getByText('70')).toBeTruthy();
    expect(document.querySelectorAll('.cup-slot--winner')).toHaveLength(3);
  });

  it('marks unfinished ties as live', () => {
    renderCups(
      [
        bracket({
          rounds: [
            {
              gameweek: 10,
              name: 'Final',
              ties: [
                {
                  label: 'Final',
                  slots: [
                    { kind: 'participant', obfuscated: false, participantId: 1, score: 30 },
                    { kind: 'participant', obfuscated: false, participantId: 2, score: 40 },
                  ],
                  status: 'provisional',
                },
              ],
            },
          ],
        }),
      ],
      10
    );

    expect(
      Array.from(document.querySelectorAll('.cup-bracket__meta')).map((node) =>
        node.textContent?.replace(/\s+/g, ' ').trim()
      )
    ).toContain('Begins Gameweek 10 (In progress)');
    expect(screen.getByText('Live')).toBeTruthy();
    expect(document.querySelector('.cup-slot--winner')).toBeNull();
  });

  it('shows an undrawn cup and a cup that has not started', () => {
    renderCups([
      bracket({ revealed: true, startGameweek: 16 }),
      bracket({
        drawAvailable: false,
        id: 'fpl-league-cup',
        name: 'FPL League Cup',
        revealed: false,
        rounds: [
          {
            gameweek: 35,
            name: 'Final',
            ties: [
              {
                label: 'Final',
                slots: [{ kind: 'to-be-drawn' }, { kind: 'to-be-drawn' }],
                status: 'scheduled',
              },
            ],
          },
        ],
        startGameweek: 35,
      }),
    ]);

    expect(screen.getByText(/^Begins Gameweek 16$/)).toBeTruthy();
    expect(
      Array.from(document.querySelectorAll('.cup-bracket__meta')).map((node) =>
        node.textContent?.replace(/\s+/g, ' ').trim()
      )
    ).toContain('Begins Gameweek 35 (Draw not yet made)');
    expect(screen.getAllByText('To be drawn')).toHaveLength(2);
  });

  it('explains when there are no cups', () => {
    renderCups([]);

    expect(screen.getByText('There are no cups this season.')).toBeTruthy();
  });
});
