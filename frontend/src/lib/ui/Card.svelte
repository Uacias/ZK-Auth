<script lang="ts">
	import type { Snippet } from 'svelte';
	
	interface Props {
		title?: string;
		class?: string;
		class_?: string;
		children?: Snippet;
	}
	
	let { title = '', class: className = '', class_ = '', children }: Props = $props();
	
	let cardClasses = $derived(`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-md ${className} ${class_}`);
</script>

<div class={cardClasses}>
	{#if title}
		<h2 class="text-gray-900 dark:text-white mb-4 text-center text-lg font-bold">{title}</h2>
	{/if}
	{@render children?.()}
</div>
