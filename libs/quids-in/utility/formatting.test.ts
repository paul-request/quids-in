import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { formatTeamValue, formatTimestamp } from './formatting';

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

describe('formatTimestamp', () => {
  const originalTimezone = process.env.TZ;

  beforeAll(() => {
    process.env.TZ = 'Europe/London';
  });

  afterAll(() => {
    process.env.TZ = originalTimezone;
  });

  it('formats an ISO timestamp as a British-locale date and time', () => {
    expect(formatTimestamp('2026-09-22T13:01:59.555Z')).toBe('22/09/2026, 14:01');
  });

  it('pads single-digit day, month, hour and minute components', () => {
    expect(formatTimestamp('2026-01-02T08:05:00.000Z')).toBe('02/01/2026, 08:05');
  });
});
