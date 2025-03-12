<script>
	export let text = 'Click';
	export let onClick;
</script>

<button
	class="bg-primary hover:bg-secondary rounded px-4 py-2 font-mono text-black transition-all"
	on:click={onClick}
>
	{text}
</button>
