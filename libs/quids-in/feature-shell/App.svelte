<script lang="ts">
  import { untrack } from 'svelte';

  import season from '../../../data/season-2026-27.json';
  import {
    calculateBiggestSlugs,
    calculateGameweekStats,
    calculateGameweekResult,
    calculateAverageWeeklyPosition,
    calculatePlayerStats,
    calculateSeasonLeaderboard,
    calculateSeasonBalances,
    calculateTeamValue,
  } from '../utility/results';
  import { indexParticipantsById } from '../utility/formatting';
  import type { Season } from '../utility/results.interfaces';

  import Header from './Header.svelte';
  import BiggestSlugsCard from './BiggestSlugsCard.svelte';
  import AverageWeeklyPositionCard from './AverageWeeklyPositionCard.svelte';
  import GameweekScoresTable from './GameweekScoresTable.svelte';
  import GameweekStatsCard from './GameweekStatsCard.svelte';
  import SeasonBalanceCard from './SeasonBalanceCard.svelte';
  import StandingsCard from './StandingsCard.svelte';
  import PlayerStats from './PlayerStats.svelte';

  let { seasonData = season }: { seasonData?: Season } = $props();

  let participantsById = $derived(indexParticipantsById(seasonData.participants));
  let leaderboard = $derived(
    calculateSeasonLeaderboard(seasonData.participants, seasonData.gameweeks),
  );
  let biggestSlugs = $derived(
    calculateBiggestSlugs(seasonData.participants, seasonData.gameweeks),
  );
  let averageWeeklyPosition = $derived(
    calculateAverageWeeklyPosition(seasonData.participants, seasonData.gameweeks),
  );
  let seasonBalances = $derived(
    calculateSeasonBalances(seasonData.participants, seasonData.gameweeks),
  );
  let latestGameweek = $derived(
    seasonData.gameweeks[seasonData.gameweeks.length - 1],
  );
  let selectedGameweekNumber = $state<number | undefined>(
    untrack(() => seasonData.gameweeks[seasonData.gameweeks.length - 1]?.gameweek),
  );
  let selectedGameweek = $derived(
    seasonData.gameweeks.find(
      (gameweek) => gameweek.gameweek === selectedGameweekNumber,
    ),
  );
  let selectedGameweekStats = $derived(
    selectedGameweek
      ? calculateGameweekStats(
          seasonData.participants,
          seasonData.gameweeks,
          selectedGameweek,
        )
      : undefined,
  );
  let currentHash = $state(typeof window === 'undefined' ? '#/' : window.location.hash || '#/');
  let playerId = $derived(getPlayerId(currentHash));
  let selectedPlayer = $derived(
    playerId === undefined ? undefined : participantsById.get(playerId),
  );
  let playerStats = $derived(
    playerId === undefined
      ? undefined
      : calculatePlayerStats(seasonData.participants, seasonData.gameweeks, playerId),
  );
  let selectedPlayerBalance = $derived(
    playerId === undefined
      ? undefined
      : seasonBalances.find((row) => row.participantId === playerId),
  );
  let selectedPlayerTeamValue = $derived(
    playerId === undefined
      ? undefined
      : calculateTeamValue(seasonData.participants, seasonData.gameweeks, playerId),
  );

  function getParticipantName(participantId: number): string {
    return participantsById.get(participantId)?.name ?? 'Unknown participant';
  }

  function getParticipantNames(participantIds: Array<number>): string {
    return participantIds.map(getParticipantName).join(', ');
  }

  function getPlayerId(hash: string): number | undefined {
    const match = /^#\/players\/(\d+)$/.exec(hash);
    const playerId = match ? Number(match[1]) : undefined;

    return playerId && Number.isInteger(playerId) ? playerId : undefined;
  }
</script>

<svelte:window onhashchange={() => (currentHash = window.location.hash || '#/')} />

{#if currentHash.startsWith('#/players/')}
  <PlayerStats
    stats={playerStats}
    participant={selectedPlayer}
    balance={selectedPlayerBalance}
    teamValue={selectedPlayerTeamValue}
  />
{:else}
<main class="page">
  <Header />

  <div class="dashboard-layout">
    {#if latestGameweek && selectedGameweek}
      {@const selectedResult = calculateGameweekResult(
        seasonData.participants,
        selectedGameweek,
      )}
      <section class="dashboard-section gameweek-card" aria-labelledby="round-heading">
        <div class="section-heading">
          <div>
            <p class="eyebrow">
              {selectedGameweek.gameweek === latestGameweek.gameweek
                ? 'Current round'
                : 'Previous round'}
            </p>
            <h1 id="round-heading">Gameweek {selectedGameweek.gameweek}</h1>
          </div>
          <label class="gameweek-picker">
            <span class="visually-hidden">Choose Gameweek</span>
            <select bind:value={selectedGameweekNumber}>
              {#each [...seasonData.gameweeks].reverse() as gameweek (gameweek.gameweek)}
                <option value={gameweek.gameweek}>
                  Gameweek {gameweek.gameweek}
                  {gameweek.gameweek === latestGameweek.gameweek ? ' (current)' : ''}
                </option>
              {/each}
            </select>
          </label>
        </div>
        <p class="visually-hidden" aria-atomic="true" aria-live="polite">
          Showing Gameweek {selectedGameweek.gameweek} results.
        </p>
        <p class="winner-summary">
          🏆 Highest score: <strong>{selectedResult.highestScore}</strong>
          (<strong>{getParticipantNames(selectedResult.winners.map((winner) => winner.participantId))}</strong>).
        </p>
        <p class="lowest-score">
          🐌 Lowest score: <strong>{selectedResult.lowestScore}</strong>
          (<strong>{getParticipantNames(selectedResult.lastPlaceParticipantIds)}</strong>).
        </p>
        <GameweekScoresTable
          gameweek={selectedGameweek}
          participants={seasonData.participants}
          result={selectedResult}
        />
      </section>
    {:else}
      <section class="empty-state" aria-labelledby="no-results-heading">
        <h1 id="no-results-heading">No Gameweek results yet</h1>
        <p>Add finalised scores to the season data to see the current round.</p>
      </section>
    {/if}

    <div class="summary-grid">
      {#if selectedGameweekStats}
        <GameweekStatsCard stats={selectedGameweekStats} />
      {/if}
      <StandingsCard {leaderboard} participants={seasonData.participants} />

      <BiggestSlugsCard
        rows={biggestSlugs}
        participants={seasonData.participants}
      />
      <AverageWeeklyPositionCard
        rows={averageWeeklyPosition}
        participants={seasonData.participants}
      />
      <SeasonBalanceCard
        rows={seasonBalances}
        participants={seasonData.participants}
      />
    </div>
  </div>
</main>
{/if}
