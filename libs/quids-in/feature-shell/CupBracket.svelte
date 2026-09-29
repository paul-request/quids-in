<script lang="ts">
  import type { CupBracket, CupSlot, CupTie, CupTieBreak } from '../utility/cups.interfaces';
  import type { Participant } from '../utility/results.interfaces';

  import PlayerTeamLink from './PlayerTeamLink.svelte';

  let {
    bracket,
    latestGameweek,
    participantsById,
  }: {
    bracket: CupBracket;
    latestGameweek: number | undefined;
    participantsById: Map<number, Participant>;
  } = $props();

  const TIE_BREAK_REASONS: Record<CupTieBreak, string> = {
    'coin-toss': 'Level after every tie-break: won on the virtual coin toss',
    'goals-conceded': 'Level on points: won on fewest goals conceded',
    'goals-scored': 'Level on points: won on most goals scored',
    'missing-score': 'Won because the opponent has no score for this Gameweek',
  };

  let headingId = $derived(`cup-${bracket.id}-heading`);
  let champion = $derived(
    bracket.championParticipantId === undefined
      ? undefined
      : participantsById.get(bracket.championParticipantId)
  );
  let metaStatus = $derived(getMetaStatus());

  function getMetaStatus(): string | undefined {
    if (!bracket.drawAvailable) {
      return '(Draw not yet made)';
    }

    if (!bracket.revealed) {
      return `(Revealed after gameweek ${bracket.revealAfterGameweek})`;
    }

    if (!champion && latestGameweek !== undefined && latestGameweek >= bracket.startGameweek) {
      return '(In progress)';
    }

    return undefined;
  }

  function isWinner(tie: CupTie, slot: CupSlot): boolean {
    return (
      slot.kind === 'participant' &&
      !slot.obfuscated &&
      tie.winnerParticipantId === slot.participantId &&
      (tie.status === 'decided' || tie.status === 'walkover')
    );
  }
</script>

<section class="dashboard-section cup-bracket" aria-labelledby={headingId}>
  <div class="cup-bracket__heading">
    <h2 id={headingId}>{bracket.name}</h2>
    <p class="cup-bracket__meta">
      <span>Begins Gameweek {bracket.startGameweek}</span>
      {#if metaStatus}
        <span class="cup-bracket__status">{metaStatus}</span>
      {/if}
      {#if champion}
        <span class="winner-badge">🏆 {champion.name}</span>
      {/if}
    </p>
  </div>

  <ol class="cup-rounds">
    {#each bracket.rounds as round (round.gameweek)}
      <li class="cup-round">
        <h3 class="cup-round__heading">
          {round.name}
          <span class="cup-round__gameweek">Gameweek {round.gameweek}</span>
        </h3>
        <ol class="cup-ties">
          {#each round.ties as tie (tie.label)}
            <li class="cup-tie" class:cup-tie--provisional={tie.status === 'provisional'}>
              <p class="cup-tie__label">
                {tie.label}
                {#if tie.status === 'provisional'}
                  <span class="cup-tie__state">Live</span>
                {/if}
              </p>
              <ul class="cup-tie__slots">
                {#each tie.slots as slot, slotIndex (slotIndex)}
                  <li class="cup-slot" class:cup-slot--winner={isWinner(tie, slot)}>
                    {#if slot.kind === 'participant' && slot.obfuscated}
                      {@const participant = participantsById.get(slot.participantId)}
                      <span class="cup-slot__obfuscated" aria-hidden="true">
                        <strong>{participant?.name ?? 'Unknown participant'}</strong>
                        <span>{participant?.teamName ?? ''}</span>
                      </span>
                      <span class="visually-hidden">
                        Hidden until Gameweek {bracket.revealAfterGameweek} ends
                      </span>
                    {:else if slot.kind === 'participant'}
                      {@const participant = participantsById.get(slot.participantId)}
                      {#if participant}
                        <PlayerTeamLink {participant} />
                      {:else}
                        <span class="cup-slot__placeholder">Unknown participant</span>
                      {/if}
                      {#if slot.score !== undefined}
                        <span class="cup-slot__score">
                          {slot.score}<span class="visually-hidden"> points</span>
                        </span>
                      {/if}
                      {#if isWinner(tie, slot)}
                        <span class="winner-badge">
                          Through<span class="visually-hidden"> to the next round</span>
                        </span>
                      {/if}
                    {:else if slot.kind === 'bye'}
                      <span class="cup-slot__placeholder">Bye</span>
                    {:else if slot.kind === 'winner-of'}
                      <span class="cup-slot__placeholder">Winner of {slot.tieLabel}</span>
                    {:else}
                      <span class="cup-slot__placeholder">To be drawn</span>
                    {/if}
                  </li>
                {/each}
              </ul>
              {#if tie.status === 'decided' && tie.tieBreak}
                <p class="cup-tie__reason">{TIE_BREAK_REASONS[tie.tieBreak]}</p>
              {/if}
            </li>
          {/each}
        </ol>
      </li>
    {/each}
  </ol>
</section>
