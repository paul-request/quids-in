<script lang="ts">
  import type {
    PlannerRow,
    PlannerTable,
    ProjectedCell,
    TransferSuggestion,
  } from '../utility/planner.interfaces';
  import { formatNumber } from '../utility/formatting';
  import type { Participant } from '../utility/results.interfaces';

  import Header from './Header.svelte';

  let {
    participant,
    table,
    suggestions,
    generatedAt,
  }: {
    participant: Participant | undefined;
    table: PlannerTable | undefined;
    suggestions: Array<TransferSuggestion>;
    generatedAt?: string;
  } = $props();

  const POSITION_LABELS = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' } as const;

  function points(value: number): string {
    return value.toFixed(1);
  }
</script>

{#snippet cell(item: ProjectedCell)}
  {#if item.fixtures.length === 0}
    <td class="planner-cell planner-cell--blank">
      <span aria-hidden="true">–</span>
      <span class="visually-hidden">No fixture</span>
    </td>
  {:else}
    <td class="planner-cell planner-cell--fdr-{Math.round(
        item.fixtures.reduce((total, fixture) => total + fixture.difficulty, 0) /
          item.fixtures.length,
      )}">
      <span class="planner-cell__fixture">
        {#each item.fixtures as fixture, index (index)}
          {index > 0 ? ' + ' : ''}{fixture.opponent}·{fixture.home ? 'H' : 'A'}
        {/each}
      </span>
      <span class="planner-cell__points">{points(item.points ?? 0)}</span>
      <span class="visually-hidden">
        Fixture difficulty {item.fixtures.map((fixture) => fixture.difficulty).join(' and ')} out of 5
      </span>
    </td>
  {/if}
{/snippet}

{#snippet playerRows(rows: Array<PlannerRow>)}
  {#each rows as row (row.playerId)}
    <tr>
      <th scope="row" class="planner-player">
        <span class="planner-player__name">{row.name}</span>
        <span class="planner-player__position">{POSITION_LABELS[row.position]} · {row.teamName}</span>
      </th>
      {#each row.cells as item (item.gameweek)}
        {@render cell(item)}
      {/each}
      <td class="planner-sum">{points(row.sum)}</td>
    </tr>
  {/each}
{/snippet}

<main class="page planner-page">
  <Header action={participant ? 'player' : 'dashboard'} playerId={participant?.id} />

  {#if table && participant}
    <section class="dashboard-section" aria-labelledby="planner-heading">
      <p class="eyebrow">Squad planner</p>
      <h1 id="planner-heading">{participant.name}</h1>
      <p class="player-stats__team">{participant.teamName}</p>
      <p class="planner-note">
        Projected points are estimates based on xG, xA, xGC, minutes played, availability and
        opponent strength, adjusted for recent form. Cells show the opponent, venue (H/A) and projected points, coloured by
        fixture difficulty.
      </p>

      <div class="table-wrapper planner-wrapper">
        <table class="planner-table">
          <caption class="visually-hidden">
            Projected points for the next {table.gameweeks.length} Gameweeks
          </caption>
          <thead>
            <tr>
              <th scope="col">Player</th>
              {#each table.gameweeks as gameweek (gameweek)}
                <th scope="col">GW{gameweek}</th>
              {/each}
              <th scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr class="planner-section">
              <th scope="row">Starting XI</th>
              <td colspan={table.gameweeks.length + 1}></td>
            </tr>
            {@render playerRows(table.starters)}
            <tr class="planner-spacer" aria-hidden="true">
              <td colspan={table.gameweeks.length + 2}></td>
            </tr>
            <tr class="planner-total">
              <th scope="row">XI total <span class="planner-player__position">Captain doubled</span></th>
              {#each table.xiTotals as total, index (index)}
                <td>{points(total)}</td>
              {/each}
              <td class="planner-sum">{formatNumber(Math.round(table.totalSum))}</td>
            </tr>
            <tr class="planner-captain">
              <th scope="row">Captain <span class="planner-player__position">Vice captain</span></th>
              {#each table.bestCaptains as captain (captain.gameweek)}
                <td>
                  {#if captain.name}
                    {captain.name}
                    {#if captain.vice}
                      <span class="planner-vice">
                        {captain.vice.name}
                      </span>
                    {/if}
                  {:else}
                    –
                  {/if}
                </td>
              {/each}
              <td></td>
            </tr>
            <tr class="planner-section">
              <th scope="row">Bench</th>
              <td colspan={table.gameweeks.length + 1}></td>
            </tr>
            {@render playerRows(table.bench)}
          </tbody>
        </table>
      </div>
      {#if generatedAt}
        <p class="planner-note planner-generated">Projections generated {new Date(generatedAt).toLocaleString('en-GB')}.</p>
      {/if}
    </section>

    <section class="dashboard-section planner-transfers" aria-labelledby="transfers-heading">
      <h2 id="transfers-heading">Transfer suggestions</h2>
      <p class="planner-note">
        Up to three players per position, over the next {table.gameweeks.length} Gameweeks, who are
        not in the squad and are projected to score more than the lowest projected squad player in
        the same position. Price is not considered.
      </p>
      <div class="planner-suggestions">
        {#each suggestions as suggestion (suggestion.position)}
          <div class="planner-suggestion">
            <h3>{POSITION_LABELS[suggestion.position]}</h3>
            {#if suggestion.replace}
              <p class="planner-note">
                Lowest in squad: {suggestion.replace.name} ({points(suggestion.replace.sum)})
              </p>
            {/if}
            {#if suggestion.candidates.length === 0}
              <p class="planner-note">No better options available.</p>
            {/if}
            <ol>
              {#each suggestion.candidates as candidate (candidate.playerId)}
                <li>
                  <strong>{candidate.name}</strong>
                  <span class="planner-player__position">{candidate.teamName}</span>
                  <span class="planner-suggestion__points">{points(candidate.sum)}</span>
                </li>
              {/each}
            </ol>
          </div>
        {/each}
      </div>
    </section>
    <p><a href="#/players/{participant.id}">Back to player stats</a></p>
  {:else}
    <section class="empty-state" aria-labelledby="planner-unavailable-heading">
      <h1 id="planner-unavailable-heading">Squad planner unavailable</h1>
      <p>
        {participant
          ? `No squad projections are available for ${participant.name} yet.`
          : 'The player was not found.'}
      </p>
      <a href="#/">Back to dashboard</a>
    </section>
  {/if}
</main>
