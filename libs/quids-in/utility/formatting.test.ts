import { describe, expect, it } from 'vitest';

import { formatTeamValue } from './formatting';

describe('formatTeamValue', () => {
  it('formats a whole-million figure without a trailing decimal', () => {
    expect(formatTeamValue(1000)).toBe('£100m');
  });

  it('formats a one-decimal-place figure', () => {
    expect(formatTeamValue(1015)).toBe('£101.5m');
  });

  it('formats zero', () => {
    expect(formatTeamValue(0)).toBe('£0m');
  });
});
