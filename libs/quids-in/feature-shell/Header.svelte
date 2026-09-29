<script lang="ts">
  let { action = 'none' }: { action?: 'cups' | 'dashboard' | 'none' } = $props();
</script>

<header class="app-header" class:app-header--with-actions={action !== 'none'}>
  <a class="brand" href="#/" aria-label="quids-in home">
    <img src="{import.meta.env.BASE_URL}logo.png" alt="Quids In" class="brand-logo" />
  </a>
  {#if action !== 'none'}
    <nav class="app-header__actions" aria-label="Main">
      {#if action === 'cups'}
        <a class="header-button" href="#/cups">
          <span aria-hidden="true">🏆</span>
          Cups
        </a>
      {:else}
        <a class="header-button" href="#/">
          <span aria-hidden="true">←</span>
          Dashboard
        </a>
      {/if}
    </nav>
  {/if}
</header>
