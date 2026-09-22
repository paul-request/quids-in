<script lang="ts">
  import type {
    Participant,
    PlayerStats as PlayerStatsResult,
    SeasonBalanceRow,
    TeamValue,
  } from '../utility/results.interfaces';
  import { formatBalance, formatNumber, formatTeamValue } from '../utility/formatting';

  let {
    stats,
    participant,
    balance,
    teamValue,
  }: {
    stats: PlayerStatsResult | undefined;
    participant: Participant | undefined;
    balance: SeasonBalanceRow | undefined;
    teamValue: TeamValue | undefined;
  } = $props();

  function formatGameweeks(gameweeks: Array<number>): string {
    const label = gameweeks.length === 1 ? 'Gameweek' : 'Gameweeks';

    return `${label} ${gameweeks.join(', ')}`;
  }
</script>

<main class="page">
  {#if stats}
    <section class="dashboard-section player-stats" aria-labelledby="player-stats-heading">
      <a class="back-link" href="#/">Back to dashboard</a>
      <p class="eyebrow">Player stats</p>
      <h1 id="player-stats-heading">{stats.participant.name}</h1>
      <p class="player-stats__team">{stats.participant.teamName}</p>
      <dl class="player-stats__list player-stats__team-value">
        <div>
          <dt>Team value</dt>
          <dd>{teamValue?.available ? formatTeamValue(teamValue.teamValueTenthsOfMillion) : 'Not available'}</dd>
        </div>
      </dl>
      <dl class="player-stats__list">
        <div><dt>Total points</dt><dd>{formatNumber(stats.totalPoints)}</dd></div>
        <div><dt>Average weekly score</dt><dd>{formatNumber(stats.averageWeeklyScore)}</dd></div>
        <div><dt>Highest score</dt><dd>{formatNumber(stats.highestScore)} ({formatGameweeks(stats.highestScoreGameweeks)})</dd></div>
        <div><dt>Lowest score</dt><dd>{formatNumber(stats.lowestScore)} ({formatGameweeks(stats.lowestScoreGameweeks)})</dd></div>
        <div><dt>Average league position</dt><dd>{formatNumber(stats.averageLeaguePosition)}</dd></div>
        <div><dt>Total transfers made</dt><dd>{formatNumber(stats.totalTransfers)}</dd></div>
        <div><dt>Season profit/loss</dt><dd>{formatBalance(stats.seasonBalancePennies)}</dd></div>
        <div><dt>Current profit/loss</dt><dd>{formatBalance(stats.currentBalancePennies)}</dd></div>
      </dl>
    </section>
  {:else if participant}
    <section class="empty-state" aria-labelledby="no-score-heading">
      <h1 id="no-score-heading">No recorded scores for {participant.name}</h1>
      <p>Player score statistics will be available once a Gameweek score is recorded.</p>
      <dl class="player-stats__list player-stats__team-value">
        <div>
          <dt>Team value</dt>
          <dd>{teamValue?.available ? formatTeamValue(teamValue.teamValueTenthsOfMillion) : 'Not available'}</dd>
        </div>
      </dl>
      {#if balance}
        <dl class="player-stats__list">
          <div><dt>Season profit/loss</dt><dd>{formatBalance(balance.netBalancePennies)}</dd></div>
          <div><dt>Current profit/loss</dt><dd>{formatBalance(balance.weeklyBalancePennies)}</dd></div>
        </dl>
      {/if}
      <a href="#/">Back to dashboard</a>
    </section>
  {:else}
    <section class="empty-state" aria-labelledby="player-not-found-heading">
      <h1 id="player-not-found-heading">Player stats unavailable</h1>
      <p>The player was not found or has no recorded scores.</p>
      <a href="#/">Back to dashboard</a>
    </section>
  {/if}
</main>
