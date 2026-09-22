<script lang="ts">
  import type {
    AverageWeeklyPositionRow,
    Participant,
  } from '../utility/results.interfaces';
  import { formatNumber, indexParticipantsById } from '../utility/formatting';
  import PlayerTeamLink from './PlayerTeamLink.svelte';

  let {
    rows,
    participants,
  }: {
    rows: Array<AverageWeeklyPositionRow>;
    participants: Array<Participant>;
  } = $props();
  let sortColumn = $state<'position' | 'score'>('position');
  let sortDirection = $state<'ascending' | 'descending'>('ascending');

  let participantsById = $derived(indexParticipantsById(participants));
  let sortedRows = $derived(
    [...rows].sort((left, right) => {
      const leftValue =
        sortColumn === 'position'
          ? left.averagePosition
          : (left.averageWeeklyScore ?? Number.NEGATIVE_INFINITY);
      const rightValue =
        sortColumn === 'position'
          ? right.averagePosition
          : (right.averageWeeklyScore ?? Number.NEGATIVE_INFINITY);

      return (sortDirection === 'ascending' ? 1 : -1) * (leftValue - rightValue);
    }),
  );

  function toggleSort(column: 'position' | 'score'): void {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'ascending' ? 'descending' : 'ascending';

      return;
    }

    sortColumn = column;
    sortDirection = column === 'position' ? 'ascending' : 'descending';
  }
</script>

<section class="dashboard-section average-position" aria-labelledby="weekly-averages-heading">
  <div class="section-heading">
    <div>
      <p class="eyebrow">Season so far</p>
      <h2 id="weekly-averages-heading">Weekly averages</h2>
    </div>
  </div>
  {#if rows.length > 0}
    <div class="table-wrapper">
      <table>
        <caption class="visually-hidden">
          Average finishing position and weekly score across recorded Gameweeks.
        </caption>
        <thead>
          <tr>
            <th scope="col">Player/team</th>
            <th aria-sort={sortColumn === 'position' ? sortDirection : 'none'} scope="col">
              <button class="sort-button" onclick={() => toggleSort('position')} type="button">
                <span class="label-full">Average position</span>
                <span aria-hidden="true" class="label-abbr">Avg. pos.</span>
              </button>
            </th>
            <th aria-sort={sortColumn === 'score' ? sortDirection : 'none'} scope="col">
              <button class="sort-button" onclick={() => toggleSort('score')} type="button">
                <span class="label-full">Average score</span>
                <span aria-hidden="true" class="label-abbr">Avg. score</span>
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {#each sortedRows as row (row.participantId)}
            {@const participant = participantsById.get(row.participantId)}
            <tr>
              <th scope="row">{#if participant}<PlayerTeamLink {participant} />{/if}</th>
              <td>{formatNumber(row.averagePosition)}</td>
              <td>{row.averageWeeklyScore === undefined
                ? 'Unavailable'
                : formatNumber(row.averageWeeklyScore)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <p class="empty-card-message">No weekly averages available yet.</p>
  {/if}
</section>
