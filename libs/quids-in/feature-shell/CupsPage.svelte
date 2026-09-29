<script lang="ts">
  import type { CupBracket as CupBracketData } from '../utility/cups.interfaces';
  import type { Participant } from '../utility/results.interfaces';

  import CupBracket from './CupBracket.svelte';
  import Header from './Header.svelte';

  let {
    cups,
    latestGameweek,
    participantsById,
  }: {
    cups: Array<CupBracketData>;
    latestGameweek: number | undefined;
    participantsById: Map<number, Participant>;
  } = $props();
</script>

<main class="page cups-page">
  <Header action="dashboard" />

  <h1 class="cups-page__heading">Cups</h1>

  {#if cups.length > 0}
    <div class="cups-page__list">
      {#each cups as bracket (bracket.id)}
        <CupBracket {bracket} {latestGameweek} {participantsById} />
      {/each}
    </div>
  {:else}
    <p class="empty-card-message">There are no cups this season.</p>
  {/if}
</main>
