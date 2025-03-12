<script lang="ts">
	export let placeholder: string = 'Type...';
	export let type: string = 'text';
	export let value: string = '';
	export let class_: string = '';
</script>

<input
	class="input focus:border-primary w-full rounded p-2 focus:outline-none {class_}"
	{type}
	bind:value
	{placeholder}
/>
