<script lang="ts">
  import { formatTimestamp } from '../utility/formatting';

  let { retrievedAt }: { retrievedAt?: string } = $props();
</script>

{#if retrievedAt}
  <footer class="app-footer">
    <p>Data last refreshed: {formatTimestamp(retrievedAt)}</p>
  </footer>
{/if}
