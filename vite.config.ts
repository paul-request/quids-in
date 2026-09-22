import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';

export default defineConfig({
  base: '/quids-in/',
  plugins: [svelte(), svelteTesting()],
  test: {
    environment: 'jsdom',
  },
});
