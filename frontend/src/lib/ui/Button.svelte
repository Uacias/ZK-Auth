<script lang="ts">
	export let text: string = 'Click';
	export let onClick: () => void = () => {};
	export let class_: string = '';
</script>

<button class="button rounded px-4 py-2 transition-all {class_}" on:click={onClick}>
	{text}
</button>
