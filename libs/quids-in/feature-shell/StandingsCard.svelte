<script lang="ts">
  import type {
    Participant,
    SeasonLeaderboard,
  } from '../utility/results.interfaces';
  import { formatNumber, indexParticipantsById } from '../utility/formatting';
  import PlayerTeamLink from './PlayerTeamLink.svelte';

  let {
    leaderboard,
    participants,
  }: {
    leaderboard: SeasonLeaderboard;
    participants: Array<Participant>;
  } = $props();
  let sortColumn = $state<'position' | 'wins'>('position');
  let sortDirection = $state<'ascending' | 'descending'>('ascending');

  let participantsById = $derived(indexParticipantsById(participants));
  let leaderboardIndexes = $derived(
    new Map(leaderboard.rows.map((row, index) => [row.participantId, index])),
  );
  let sortedRows = $derived(
    [...leaderboard.rows].sort((left, right) => {
      const leftIndex = leaderboardIndexes.get(left.participantId) ?? 0;
      const rightIndex = leaderboardIndexes.get(right.participantId) ?? 0;
      const leftValue = sortColumn === 'position' ? leftIndex : left.totalWins;
      const rightValue = sortColumn === 'position' ? rightIndex : right.totalWins;

      return (sortDirection === 'ascending' ? 1 : -1) * (leftValue - rightValue);
    }),
  );

  function toggleSort(column: 'position' | 'wins'): void {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'ascending' ? 'descending' : 'ascending';

      return;
    }

    sortColumn = column;
    sortDirection = column === 'position' ? 'ascending' : 'descending';
  }

  function getPositionLabel(index: number): string {
    const currentRow = leaderboard.rows[index];
    const previousRow = leaderboard.rows[index - 1];

    return previousRow && previousRow.totalWins === currentRow.totalWins
      ? '='
      : String(index + 1);
  }
</script>

<section class="dashboard-section standings" aria-labelledby="standings-heading">
  <div class="section-heading">
    <div>
      <p class="eyebrow">Season so far</p>
      <h2 id="standings-heading">Overall standings</h2>
    </div>
  </div>
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th aria-sort={sortColumn === 'position' ? sortDirection : 'none'} scope="col">
            <button class="sort-button" onclick={() => toggleSort('position')} type="button">
              Position
            </button>
          </th>
          <th scope="col">Player/team</th>
          <th aria-sort={sortColumn === 'wins' ? sortDirection : 'none'} scope="col">
            <button class="sort-button" onclick={() => toggleSort('wins')} type="button">
              Wins
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        {#each sortedRows as row (row.participantId)}
          {@const participant = participantsById.get(row.participantId)}
          {@const leaderboardIndex = leaderboardIndexes.get(row.participantId) ?? 0}
          <tr>
            <td>{getPositionLabel(leaderboardIndex)}</td>
            <th scope="row">{#if participant}<PlayerTeamLink {participant} />{/if}</th>
            <td>{formatNumber(row.totalWins)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</section>
