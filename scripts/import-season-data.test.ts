import { describe, expect, it, vi } from 'vitest';

import { importSeasonData } from './import-season-data.mjs';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

describe('importSeasonData', () => {
  it('imports every standings page with FPL entry IDs, score metadata, and squad value/bank when present', async () => {
    const fetchFn = vi.fn(async (url: string) => {
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
    });

    const season = await importSeasonData({
      fetchFn,
      retrievedAt: '2026-09-21T12:00:00.000Z',
    });

    expect(season).toEqual({
      gameweeks: [
        {
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

  it('rejects incomplete Gameweek histories rather than emitting partial data', async () => {
    const fetchFn = vi.fn(async (url: string) => {
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
    });

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
    const fetchFn = vi.fn(async (url: string) => {
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
    });

    await expect(importSeasonData({ fetchFn })).rejects.toThrow(
      'Squad value for entry 101 must be a non-negative integer',
    );
  });

  it('rejects a non-integer bank value', async () => {
    const fetchFn = vi.fn(async (url: string) => {
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
    });

    await expect(importSeasonData({ fetchFn })).rejects.toThrow(
      'Bank for entry 101 must be a non-negative integer',
    );
  });
});
