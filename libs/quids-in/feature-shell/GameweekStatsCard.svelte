<script lang="ts">
  import type { GameweekStats } from '../utility/results.interfaces';
  import { formatNumber, formatSignedNumber } from '../utility/formatting';

  let { stats }: { stats: GameweekStats } = $props();
</script>

<section class="dashboard-section gameweek-stats" aria-labelledby="gameweek-stats-heading">
  <div class="section-heading">
    <div>
      <p class="eyebrow">Selected Gameweek</p>
      <h2 id="gameweek-stats-heading">Gameweek stats</h2>
    </div>
  </div>
  {#if stats.available}
    <dl class="gameweek-stats__list">
      <div>
        <dt>Highest score</dt>
        <dd>{formatNumber(stats.highestScore)}</dd>
      </div>
      <div>
        <dt>Lowest score</dt>
        <dd>{formatNumber(stats.lowestScore)}</dd>
      </div>
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
      <div>
        <dt>Difference from season average</dt>
        <dd>{formatSignedNumber(stats.differenceFromSeasonAverage)}</dd>
      </div>
    </dl>
  {:else}
    <p class="empty-card-message">
      Gameweek statistics are unavailable because no usable scores were recorded.
    </p>
  {/if}
</section>
