import { describe, expect, it, vi } from 'vitest';

import { importSeasonData } from './import-season-data.mjs';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

const bootstrapResponse = {
  events: [
    { average_entry_score: 50, data_checked: true, finished: true, id: 1 },
    { average_entry_score: 81, data_checked: false, finished: true, id: 2 },
    { average_entry_score: 0, data_checked: false, finished: false, id: 3 },
  ],
};

function withGameweekStatus(
  handler: (url: string) => Promise<Response>,
): (url: string) => Promise<Response> {
  return async (url: string) =>
    url.includes('/bootstrap-static/')
      ? jsonResponse(bootstrapResponse)
      : handler(url);
}

describe('importSeasonData', () => {
  it('retries transient FPL failures before returning imported data', async () => {
    let standingsAttempts = 0;
    const fetchFn = vi.fn(
      withGameweekStatus(async (url: string) => {
        if (url.includes('standings')) {
          standingsAttempts += 1;

          if (standingsAttempts === 1) {
            return jsonResponse({}, 503);
          }

          return jsonResponse({
            standings: {
              has_next: false,
              page: 1,
              results: [
                { entry: 101, entry_name: 'Team One', player_name: 'Alex' },
              ],
            },
          });
        }

        return jsonResponse({
          current: [
            {
              event: 1,
              event_transfers: 0,
              event_transfers_cost: 0,
              points: 60,
            },
          ],
        });
      }),
    );

    const season = await importSeasonData({
      fetchFn,
      retrievedAt: '2026-09-21T12:00:00.000Z',
    });

    expect(season.participants).toEqual([
      { id: 101, name: 'Alex', teamName: 'Team One' },
    ]);
    expect(standingsAttempts).toBe(2);
  });

  it('imports every standings page with FPL entry IDs, score metadata, and squad value/bank when present', async () => {
    const fetchFn = vi.fn(
      withGameweekStatus(async (url: string) => {
        if (url.includes('page_standings=1')) {
          return jsonResponse({
            standings: {
              has_next: true,
              page: 1,
              results: [
                { entry: 101, entry_name: 'Team One', player_name: 'Alex' },
              ],
            },
          });
        }

        if (url.includes('page_standings=2')) {
          return jsonResponse({
            standings: {
              has_next: false,
              page: 2,
              results: [
                { entry: 202, entry_name: 'Team Two', player_name: 'Blair' },
              ],
            },
          });
        }

        if (url.includes('/entry/101/history/')) {
          return jsonResponse({
            chips: [
              { event: 2, name: 'wildcard' },
              { event: 3, name: 'freehit' },
              { event: 4, name: 'wildcard' },
            ],
            current: [
              {
                bank: 5,
                event: 1,
                event_transfers: 0,
                event_transfers_cost: 0,
                points: 60,
                value: 1000,
              },
              {
                event: 2,
                event_transfers: 2,
                event_transfers_cost: 4,
                points: 70,
              },
              {
                bank: 8,
                event: 3,
                event_transfers: 3,
                event_transfers_cost: 8,
                points: 75,
                value: 1015,
              },
              {
                event: 4,
                event_transfers: 1,
                event_transfers_cost: 4,
                points: 63,
              },
            ],
          });
        }

        return jsonResponse({
          chips: [],
          current: [
            {
              event: 1,
              event_transfers: 1,
              event_transfers_cost: 4,
              points: 55,
            },
            {
              event: 2,
              event_transfers: 0,
              event_transfers_cost: 0,
              points: 71,
            },
            {
              event: 3,
              event_transfers: 1,
              event_transfers_cost: 4,
              points: 62,
            },
            {
              event: 4,
              event_transfers: 0,
              event_transfers_cost: 0,
              points: 59,
            },
          ],
        });
      }),
    );

    const season = await importSeasonData({
      fetchFn,
      retrievedAt: '2026-09-21T12:00:00.000Z',
    });

    expect(season).toEqual({
      gameweeks: [
        {
          ended: true,
          fplAverage: 50,
          gameweek: 1,
          scores: {
            101: {
              bank: 5,
              points: 60,
              squadValue: 1000,
              transferCost: 0,
              transfers: 0,
            },
            202: { points: 51, transferCost: 4, transfers: 1 },
          },
        },
        {
          ended: false,
          gameweek: 2,
          scores: {
            101: {
              chip: 'wildcard',
              points: 66,
              transferCost: 4,
              transfers: 2,
            },
            202: { points: 71, transferCost: 0, transfers: 0 },
          },
        },
        {
          ended: false,
          gameweek: 3,
          scores: {
            101: {
              bank: 8,
              chip: 'freehit',
              points: 67,
              squadValue: 1015,
              transferCost: 8,
              transfers: 3,
            },
            202: { points: 58, transferCost: 4, transfers: 1 },
          },
        },
        {
          ended: false,
          gameweek: 4,
          scores: {
            101: {
              chip: 'wildcard',
              points: 59,
              transferCost: 4,
              transfers: 1,
            },
            202: { points: 59, transferCost: 0, transfers: 0 },
          },
        },
      ],
      participants: [
        { id: 101, name: 'Alex', teamName: 'Team One' },
        { id: 202, name: 'Blair', teamName: 'Team Two' },
      ],
      season: '2026-27',
      source: { leagueId: 869128, retrievedAt: '2026-09-21T12:00:00.000Z' },
    });
  });

  it.each([
    ['missing', {}],
    ['negative', { average_entry_score: -1 }],
    ['non-numeric', { average_entry_score: '50' }],
    ['null', { average_entry_score: null }],
  ])(
    'omits a %s FPL average without failing the import',
    async (_description, averageField) => {
      let bootstrapRequests = 0;
      const fetchFn = vi.fn(async (url: string) => {
        if (url.includes('/bootstrap-static/')) {
          bootstrapRequests += 1;

          return jsonResponse({
            events: [
              { data_checked: true, finished: true, id: 1, ...averageField },
            ],
          });
        }

        if (url.includes('standings')) {
          return jsonResponse({
            standings: {
              has_next: false,
              page: 1,
              results: [
                { entry: 101, entry_name: 'Team One', player_name: 'Alex' },
              ],
            },
          });
        }

        return jsonResponse({
          current: [
            {
              event: 1,
              event_transfers: 0,
              event_transfers_cost: 0,
              points: 60,
            },
          ],
        });
      });

      const season = await importSeasonData({
        fetchFn,
        retrievedAt: '2026-09-21T12:00:00.000Z',
      });

      expect(season.gameweeks[0].ended).toBe(true);
      expect(season.gameweeks[0]).not.toHaveProperty('fplAverage');
      expect(bootstrapRequests).toBe(1);
    },
  );

  it('rejects incomplete Gameweek histories rather than emitting partial data', async () => {
    const fetchFn = vi.fn(
      withGameweekStatus(async (url: string) => {
        if (url.includes('standings')) {
          return jsonResponse({
            standings: {
              has_next: false,
              page: 1,
              results: [
                { entry: 101, entry_name: 'Team One', player_name: 'Alex' },
                { entry: 202, entry_name: 'Team Two', player_name: 'Blair' },
              ],
            },
          });
        }

        return jsonResponse({
          current: url.includes('/101/')
            ? [
                {
                  event: 1,
                  event_transfers: 0,
                  event_transfers_cost: 0,
                  points: 60,
                },
              ]
            : [],
        });
      }),
    );

    await expect(importSeasonData({ fetchFn })).rejects.toThrow(
      'Missing Gameweek 1 score for entry 202',
    );
  });

  it('rejects malformed standings pages', async () => {
    const fetchFn = vi.fn(async () => jsonResponse({ standings: {} }));

    await expect(importSeasonData({ fetchFn })).rejects.toThrow(
      'Malformed standings payload for page 1',
    );
  });

  it('rejects a negative squad value', async () => {
    const fetchFn = vi.fn(
      withGameweekStatus(async (url: string) => {
        if (url.includes('standings')) {
          return jsonResponse({
            standings: {
              has_next: false,
              page: 1,
              results: [
                { entry: 101, entry_name: 'Team One', player_name: 'Alex' },
              ],
            },
          });
        }

        return jsonResponse({
          current: [
            {
              event: 1,
              event_transfers: 0,
              event_transfers_cost: 0,
              points: 60,
              value: -1,
            },
          ],
        });
      }),
    );

    await expect(importSeasonData({ fetchFn })).rejects.toThrow(
      'Squad value for entry 101 must be a non-negative integer',
    );
  });

  it('rejects a non-integer bank value', async () => {
    const fetchFn = vi.fn(
      withGameweekStatus(async (url: string) => {
        if (url.includes('standings')) {
          return jsonResponse({
            standings: {
              has_next: false,
              page: 1,
              results: [
                { entry: 101, entry_name: 'Team One', player_name: 'Alex' },
              ],
            },
          });
        }

        return jsonResponse({
          current: [
            {
              bank: 2.5,
              event: 1,
              event_transfers: 0,
              event_transfers_cost: 0,
              points: 60,
            },
          ],
        });
      }),
    );

    await expect(importSeasonData({ fetchFn })).rejects.toThrow(
      'Bank for entry 101 must be a non-negative integer',
    );
  });

  describe('knockout cup data', () => {
    const standings = {
      league: { cup_league: null as number | null },
      standings: {
        has_next: false,
        page: 1,
        results: [
          { entry: 101, entry_name: 'Team One', player_name: 'Alex' },
          { entry: 202, entry_name: 'Team Two', player_name: 'Blair' },
        ],
      },
    };
    const history = {
      current: [
        { event: 1, event_transfers: 0, event_transfers_cost: 0, points: 60 },
        { event: 2, event_transfers: 0, event_transfers_cost: 0, points: 50 },
      ],
    };

    it('adds goals scored and conceded for tie-break Gameweeks after automatic subs', async () => {
      const requestedUrls: Array<string> = [];
      const fetchFn = vi.fn(
        withGameweekStatus(async (url: string) => {
          requestedUrls.push(url);

          if (url.includes('standings')) {
            return jsonResponse(standings);
          }

          if (url.includes('/history/')) {
            return jsonResponse(history);
          }

          if (url.includes('/event/2/live/')) {
            return jsonResponse({
              elements: [
                { id: 1, stats: { goals_conceded: 2, goals_scored: 1 } },
                { id: 2, stats: { goals_conceded: 0, goals_scored: 2 } },
                { id: 12, stats: { goals_conceded: 1, goals_scored: 1 } },
                { id: 13, stats: { goals_conceded: 3, goals_scored: 0 } },
              ],
            });
          }

          if (url.includes('/entry/101/event/2/picks/')) {
            return jsonResponse({
              active_chip: null,
              automatic_subs: [{ element_in: 12, element_out: 2 }],
              picks: [
                { element: 1, multiplier: 2, position: 1 },
                { element: 2, multiplier: 1, position: 2 },
                { element: 12, multiplier: 0, position: 12 },
                { element: 13, multiplier: 0, position: 13 },
              ],
            });
          }

          if (url.includes('/entry/202/event/2/picks/')) {
            return jsonResponse({
              active_chip: 'bboost',
              automatic_subs: [],
              picks: [
                { element: 2, multiplier: 1, position: 1 },
                { element: 13, multiplier: 1, position: 13 },
              ],
            });
          }

          throw new Error(`Unexpected URL ${url}`);
        }),
      );

      const season = await importSeasonData({
        fetchFn,
        retrievedAt: '2026-09-21T12:00:00.000Z',
        tieBreakGameweeks: [2, 3],
      });

      expect(season.gameweeks[0].scores[101]).not.toHaveProperty('goalsScored');
      expect(season.gameweeks[1].scores[101]).toMatchObject({
        goalsConceded: 3,
        goalsScored: 2,
      });
      expect(season.gameweeks[1].scores[202]).toMatchObject({
        goalsConceded: 3,
        goalsScored: 2,
      });
      expect(requestedUrls.some((url) => url.includes('/event/1/'))).toBe(
        false,
      );
      expect(requestedUrls.some((url) => url.includes('/event/3/'))).toBe(
        false,
      );
    });

    it('imports and de-duplicates FPL League Cup matches once the cup exists', async () => {
      const match = {
        entry_1_entry: 101,
        entry_1_points: 60,
        entry_2_entry: 202,
        entry_2_points: 50,
        event: 2,
        id: 7,
        is_bye: false,
        knockout_name: 'Final',
        winner: 101,
      };
      const fetchFn = vi.fn(
        withGameweekStatus(async (url: string) => {
          if (url.includes('standings')) {
            return jsonResponse({ ...standings, league: { cup_league: 555 } });
          }

          if (url.includes('/history/')) {
            return jsonResponse(history);
          }

          if (url.includes('/leagues-h2h-matches/league/555/?page=1')) {
            return jsonResponse({
              has_next: true,
              page: 1,
              results: [
                {
                  entry_1_entry: 202,
                  entry_1_points: 0,
                  entry_2_entry: null,
                  entry_2_points: null,
                  event: 1,
                  id: 3,
                  is_bye: true,
                  winner: 202,
                },
                match,
              ],
            });
          }

          if (url.includes('/leagues-h2h-matches/league/555/?page=2')) {
            return jsonResponse({ has_next: false, page: 2, results: [match] });
          }

          throw new Error(`Unexpected URL ${url}`);
        }),
      );

      const season = await importSeasonData({
        fetchFn,
        retrievedAt: '2026-09-21T12:00:00.000Z',
      });

      expect(season.fplCup).toEqual({
        cupLeagueId: 555,
        matches: [
          {
            entry1: 202,
            entry1Points: 0,
            entry2: null,
            entry2Points: null,
            gameweek: 1,
            id: 3,
            isBye: true,
            winner: 202,
          },
          {
            entry1: 101,
            entry1Points: 60,
            entry2: 202,
            entry2Points: 50,
            gameweek: 2,
            id: 7,
            isBye: false,
            knockoutName: 'Final',
            winner: 101,
          },
        ],
      });
    });

    it('warns and omits the FPL League Cup when its matches cannot be imported', async () => {
      const logWarning = vi.fn();
      const fetchFn = vi.fn(
        withGameweekStatus(async (url: string) => {
          if (url.includes('standings')) {
            return jsonResponse({ ...standings, league: { cup_league: 555 } });
          }

          if (url.includes('/history/')) {
            return jsonResponse(history);
          }

          return jsonResponse({ detail: 'Not found.' }, 404);
        }),
      );

      const season = await importSeasonData({ fetchFn, logWarning });

      expect(season).not.toHaveProperty('fplCup');
      expect(logWarning).toHaveBeenCalledWith(
        expect.stringContaining('Skipping FPL League Cup import'),
      );
    });

    it('rejects a malformed Gameweek status payload', async () => {
      const fetchFn = vi.fn(async (url: string) => {
        if (url.includes('standings')) {
          return jsonResponse(standings);
        }

        if (url.includes('/history/')) {
          return jsonResponse(history);
        }

        return jsonResponse({});
      });

      await expect(importSeasonData({ fetchFn })).rejects.toThrow(
        'Malformed Gameweek status payload',
      );
    });
  });
});
