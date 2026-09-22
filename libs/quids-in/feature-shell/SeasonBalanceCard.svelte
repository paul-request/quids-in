<script lang="ts">
  import type {
    Participant,
    SeasonBalanceRow,
  } from '../utility/results.interfaces';
  import { formatBalance, indexParticipantsById } from '../utility/formatting';
  import PlayerTeamLink from './PlayerTeamLink.svelte';

  let {
    rows,
    participants,
  }: {
    rows: Array<SeasonBalanceRow>;
    participants: Array<Participant>;
  } = $props();
  let sortColumn = $state<'season' | 'weekly'>('season');
  let sortDirection = $state<'ascending' | 'descending'>('descending');

  let participantsById = $derived(indexParticipantsById(participants));
  let sortedRows = $derived(
    [...rows].sort((left, right) => {
      const leftValue =
        sortColumn === 'season' ? left.netBalancePennies : left.weeklyBalancePennies;
      const rightValue =
        sortColumn === 'season' ? right.netBalancePennies : right.weeklyBalancePennies;

      return (sortDirection === 'ascending' ? 1 : -1) * (leftValue - rightValue);
    }),
  );

  function toggleSort(column: 'season' | 'weekly'): void {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'ascending' ? 'descending' : 'ascending';

      return;
    }

    sortColumn = column;
    sortDirection = 'descending';
  }

  function getBalanceClass(pennies: number): string {
    if (pennies > 0) {
      return 'balance-value--positive';
    }

    if (pennies < 0) {
      return 'balance-value--negative';
    }

    return 'balance-value--neutral';
  }
</script>

<section class="dashboard-section season-balance" aria-labelledby="season-balance-heading">
  <div class="section-heading">
    <div>
      <p class="eyebrow">Season so far</p>
      <h2 id="season-balance-heading">Profit &amp; loss</h2>
    </div>
  </div>
  <div class="table-wrapper">
    <table>
      <caption class="visually-hidden">
        Season balance after the fixed season contribution and weekly balance
        after Gameweek contributions.
      </caption>
      <thead>
        <tr>
          <th scope="col">Player/team</th>
          <th aria-sort={sortColumn === 'season' ? sortDirection : 'none'} scope="col">
            <button class="sort-button" onclick={() => toggleSort('season')} type="button">
              <span class="label-full">Season balance</span>
              <span aria-hidden="true" class="label-abbr">Season</span>
            </button>
          </th>
          <th aria-sort={sortColumn === 'weekly' ? sortDirection : 'none'} scope="col">
            <button class="sort-button" onclick={() => toggleSort('weekly')} type="button">
              <span class="label-full">Weekly balance</span>
              <span aria-hidden="true" class="label-abbr">Weekly</span>
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        {#each sortedRows as row (row.participantId)}
          {@const participant = participantsById.get(row.participantId)}
          <tr>
            <th scope="row">{#if participant}<PlayerTeamLink {participant} />{/if}</th>
            <td class={`balance-value ${getBalanceClass(row.netBalancePennies)}`}>
              {formatBalance(row.netBalancePennies)}
            </td>
            <td class={`balance-value ${getBalanceClass(row.weeklyBalancePennies)}`}>
              {formatBalance(row.weeklyBalancePennies)}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</section>
