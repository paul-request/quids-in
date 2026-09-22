<script lang="ts">
  import type {
    BiggestSlugRow,
    Participant,
  } from '../utility/results.interfaces';
  import { indexParticipantsById } from '../utility/formatting';
  import PlayerTeamLink from './PlayerTeamLink.svelte';

  let {
    rows,
    participants,
  }: {
    rows: Array<BiggestSlugRow>;
    participants: Array<Participant>;
  } = $props();
  let lossesSortDirection = $state<'ascending' | 'descending'>('descending');

  let participantsById = $derived(indexParticipantsById(participants));
  let sortedRows = $derived(
    [...rows].sort(
      (left, right) =>
        (lossesSortDirection === 'descending' ? -1 : 1) *
        (left.weeklyLosses - right.weeklyLosses),
    ),
  );

  function toggleLossesSort(): void {
    lossesSortDirection =
      lossesSortDirection === 'descending' ? 'ascending' : 'descending';
  }
</script>

<section class="dashboard-section biggest-slugs" aria-labelledby="biggest-slugs-heading">
  <div class="section-heading">
    <div>
      <p class="eyebrow">Most weekly losses</p>
      <h2 id="biggest-slugs-heading">The slugs</h2>
    </div>
  </div>
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th scope="col">Player/team</th>
          <th aria-sort={lossesSortDirection} scope="col">
            <button class="sort-button" onclick={toggleLossesSort} type="button">
              Losses
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        {#each sortedRows as row (row.participantId)}
          {@const participant = participantsById.get(row.participantId)}
          <tr>
            <th scope="row">{#if participant}<PlayerTeamLink {participant} />{/if}</th>
            <td>{row.weeklyLosses}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</section>
