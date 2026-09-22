import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import Header from './Header.svelte';

describe('Header', () => {
  it('should render a labelled home link containing the logo', () => {
    render(Header);

    const homeLink = screen.getByRole('link', { name: 'quids-in home' });
    const logo = homeLink.querySelector('img');

    expect(logo?.getAttribute('src')).toBe('/logo.png');
    expect(logo?.getAttribute('alt')).toBe('Quids In');
  });
});
