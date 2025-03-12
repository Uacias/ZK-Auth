<script>
	import { theme } from '$lib/store';
	import { Sun, Moon } from 'lucide-svelte';

	function toggleTheme() {
		theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
		document.documentElement.classList.toggle('light');
	}
</script>

<button
	class="rounded-full p-2 transition-all hover:bg-gray-600 dark:hover:bg-gray-400"
	on:click={toggleTheme}
>
	{#if $theme === 'dark'}
		<Moon size="24" color="white" />
	{:else}
		<Sun size="24" color="black" />
	{/if}
</button>
