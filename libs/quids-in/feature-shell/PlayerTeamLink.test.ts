import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import PlayerTeamLink from './PlayerTeamLink.svelte';
import type { Participant } from '../utility/results.interfaces';

describe('PlayerTeamLink', () => {
  it('renders a deep link to the player stats route with the name and team', () => {
    const participant: Participant = { id: 78294, name: 'Alice', teamName: 'Aces High' };

    render(PlayerTeamLink, { props: { participant } });

    const link = screen.getByRole('link', { name: 'Alice Aces High' });

    expect(link.getAttribute('href')).toBe('#/players/78294');
    expect(screen.getByText('Alice')).toBeTruthy();
    expect(screen.getByText('Aces High')).toBeTruthy();
  });
});
