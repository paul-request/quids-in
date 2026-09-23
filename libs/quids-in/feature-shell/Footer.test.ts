import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import Footer from './Footer.svelte';

describe('Footer', () => {
  it('renders the last-refreshed timestamp when provided', () => {
    render(Footer, { props: { retrievedAt: '2026-09-22T13:01:59.555Z' } });

    expect(screen.getByText(/Data last refreshed:/)).toBeTruthy();
  });

  it('renders nothing when no timestamp is available', () => {
    const { container } = render(Footer, { props: {} });

    expect(container.querySelector('.app-footer')).toBeNull();
  });
});
