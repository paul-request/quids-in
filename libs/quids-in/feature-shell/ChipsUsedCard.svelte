<script lang="ts">
  import { formatChipName } from '../utility/formatting';
  import type { PlayerChip } from '../utility/results.interfaces';

  let { chips }: { chips: Array<PlayerChip> } = $props();
</script>

<section class="chips-used" aria-labelledby="chips-used-heading">
  <h2 id="chips-used-heading">Chips used</h2>
  {#each [1, 2] as half (half)}
    <h3>{half === 1 ? 'First half (GW1-19)' : 'Second half (GW20-38)'}</h3>
    <ul class="chips-used__badges">
      {#each chips.filter((chip) => chip.half === half) as chip (chip.name)}
        <li
          class="chip-badge chips-used__badge"
          class:chips-used__badge--used={chip.gameweek !== undefined}
        >
          {formatChipName(chip.name)}
          <span
            class="chips-used__status"
            class:visually-hidden={chip.gameweek === undefined}
          >
            {chip.gameweek === undefined ? 'Not used' : `Used GW${chip.gameweek}`}
          </span>
        </li>
      {/each}
    </ul>
  {/each}
</section>
