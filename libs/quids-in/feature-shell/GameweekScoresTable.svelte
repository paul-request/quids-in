<script lang="ts">
  import type {
    Gameweek,
    GameweekScore,
    GameweekResult,
    Participant,
  } from '../utility/results.interfaces';
  import PlayerTeamLink from './PlayerTeamLink.svelte';

  let {
    gameweek,
    participants,
    result,
  }: {
    gameweek: Gameweek;
    participants: Array<Participant>;
    result: GameweekResult;
  } = $props();
  let scoreSortDirection = $state<'ascending' | 'descending'>('descending');

  function getScore(participantId: number): number {
    return getGameweekScore(participantId)?.points ?? 0;
  }

  function getGameweekScore(participantId: number): GameweekScore | undefined {
    return gameweek.scores[String(participantId)];
  }

  function getChipLabel(chip: string): string {
    const chipLabels: Record<string, string> = {
      '3xc': 'TC',
      bboost: 'BB',
      freehit: 'FH',
      wildcard: 'WC',
    };

    return chipLabels[chip] ?? chip.toUpperCase();
  }

  function getChipDescription(chip: string): string {
    const chipNames: Record<string, string> = {
      '3xc': 'Triple Captain',
      bboost: 'Bench Boost',
      freehit: 'Free Hit',
      wildcard: 'Wildcard',
    };

    return chipNames[chip] ?? chip;
  }

  function isWinner(participantId: number): boolean {
    return result.winners.some(
      (winner) => winner.participantId === participantId,
    );
  }

  function isLastPlace(participantId: number): boolean {
    return result.lastPlaceParticipantIds.includes(participantId);
  }

  const participantsByScore = $derived(
    participants
      .map((participant, index) => ({
        index,
        participant,
        score: getScore(participant.id),
      }))
      .sort(
        (left, right) =>
          (scoreSortDirection === 'descending' ? -1 : 1) * (left.score - right.score) ||
          left.index - right.index,
      ),
  );

  function toggleScoreSort(): void {
    scoreSortDirection =
      scoreSortDirection === 'descending' ? 'ascending' : 'descending';
  }
</script>

<div class="score-table-wrapper">
  <table class="score-table">
    <thead>
      <tr>
        <th scope="col">Player/team</th>
        <th aria-sort={scoreSortDirection} scope="col">
          <button class="sort-button" onclick={toggleScoreSort} type="button">
            Score
          </button>
        </th>
        <th scope="col">Chip</th>
      </tr>
    </thead>
    <tbody>
      {#each participantsByScore as { participant, score } (participant.id)}
        {@const winner = isWinner(participant.id)}
        {@const lastPlace = isLastPlace(participant.id)}
        {@const gameweekScore = getGameweekScore(participant.id)}
        <tr class:winning-score={winner}>
          <th scope="row">
            <PlayerTeamLink {participant} />
            {#if winner}<span class="winner-badge">🏆 <span class="badge-label">Winner</span></span>{/if}
            {#if lastPlace}<span class="last-place-badge">🐌 <span class="badge-label">Slug</span></span>{/if}
          </th>
          <td>{score}</td>
          <td>
            {#if gameweekScore?.chip}
              <span
                class="chip-badge"
                aria-label={`Chip: ${getChipDescription(gameweekScore.chip)}`}
              >
                {getChipLabel(gameweekScore.chip)}
              </span>
            {/if}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
