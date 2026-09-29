import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import Header from './Header.svelte';

describe('Header', () => {
  it('should render a labelled home link containing the logo', () => {
    render(Header, { props: { action: 'none' } });

    const homeLink = screen.getByRole('link', { name: 'quids-in home' });
    const logo = homeLink.querySelector('img');

    expect(logo?.getAttribute('src')).toBe('/logo.png');
    expect(logo?.getAttribute('alt')).toBe('Quids In');
    expect(screen.queryByRole('link', { name: 'Cups' })).toBeNull();
  });

  it('should render a Cups button beside the logo for the cups action', () => {
    render(Header, { props: { action: 'cups' } });

    const cupsLink = screen.getByRole('link', { name: 'Cups' });

    expect(cupsLink.getAttribute('href')).toBe('#/cups');
    expect(cupsLink.closest('nav')?.getAttribute('aria-label')).toBe('Main');
    expect(document.querySelector('.app-header--with-actions')).toBeTruthy();
  });

  it('should render a Dashboard button beside the logo for the dashboard action', () => {
    render(Header, { props: { action: 'dashboard' } });

    const dashboardLink = screen.getByRole('link', { name: 'Dashboard' });

    expect(dashboardLink.getAttribute('href')).toBe('#/');
    expect(document.querySelector('.app-header--with-actions')).toBeTruthy();
  });
});
