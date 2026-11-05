<script lang="ts">
  import type {
    GameweekResult,
    GameweekStats,
    Participant,
  } from '../utility/results.interfaces';
  import {
    formatNumber,
    formatSignedNumber,
    indexParticipantsById,
  } from '../utility/formatting';

  let {
    gameweek,
    participants,
    result,
    stats,
  }: {
    gameweek: number;
    participants: Array<Participant>;
    result: GameweekResult;
    stats: GameweekStats;
  } = $props();
  let participantsById = $derived(indexParticipantsById(participants));

  function getParticipantNames(participantIds: Array<number>): string {
    return participantIds
      .map(
        (participantId) =>
          participantsById.get(participantId)?.name ?? 'Unknown participant',
      )
      .join(', ');
  }
</script>

<section class="dashboard-section gameweek-stats" aria-labelledby="gameweek-stats-heading">
  <div class="section-heading">
    <div>
      <p class="eyebrow">Selected Gameweek</p>
      <h2 id="gameweek-stats-heading">Gameweek {gameweek} stats</h2>
    </div>
  </div>
  <p class="winner-summary">
    <span aria-hidden="true">🏆 </span>Highest score: <strong>{formatNumber(result.highestScore)}</strong>
    (<strong>{getParticipantNames(result.winners.map((winner) => winner.participantId))}</strong>).
  </p>
  <p class="lowest-score">
    <span aria-hidden="true">🐌 </span>Lowest score: <strong>{formatNumber(result.lowestScore)}</strong>
    (<strong>{getParticipantNames(result.lastPlaceParticipantIds)}</strong>).
  </p>
  {#if stats.available}
    <dl class="gameweek-stats__list">
      <div>
        <dt>League average</dt>
        <dd>{formatNumber(stats.leagueAverage)}</dd>
      </div>
      {#if stats.fplAverage !== undefined && stats.differenceFromFplAverage !== undefined}
        <div>
          <dt>FPL average</dt>
          <dd>{formatNumber(stats.fplAverage)}</dd>
        </div>
        <div>
          <dt>Difference from FPL average</dt>
          <dd>{formatSignedNumber(stats.differenceFromFplAverage)}</dd>
        </div>
      {/if}
      <div>
        <dt>Spread</dt>
        <dd>{formatNumber(stats.spread)}</dd>
      </div>
      {#if stats.differenceFromSeasonAverage !== undefined}
        <div>
          <dt>Difference from season average</dt>
          <dd>{formatSignedNumber(stats.differenceFromSeasonAverage)}</dd>
        </div>
      {/if}
    </dl>
  {:else}
    <p class="empty-card-message">
      Gameweek statistics are unavailable because no usable scores were recorded.
    </p>
  {/if}
</section>
