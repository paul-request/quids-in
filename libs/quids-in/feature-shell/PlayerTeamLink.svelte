<script lang="ts">
  import type { Participant } from '../utility/results.interfaces';

  let { participant }: { participant: Participant } = $props();
</script>

<a class="player-team-link" href={`#/players/${participant.id}`}>
  <strong class="player-team-link__name">{participant.name}</strong>
  <span class="player-team-link__team">{participant.teamName}</span>
</a>
