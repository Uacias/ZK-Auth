<script lang="ts">
	import { fade } from 'svelte/transition';

	import { toast, type Toast } from '$lib/stores/toast';
	import { onDestroy } from 'svelte';

	let toastData: Toast | null = null;
	let timeout: ReturnType<typeof setTimeout> | undefined;

	const unsubscribe = toast.subscribe((value) => {
		toastData = value;

		if (timeout) clearTimeout(timeout);
		if (value) {
			timeout = setTimeout(() => {
				toast.set(null);
			}, 4000);
		}
	});

	onDestroy(() => {
		if (timeout) clearTimeout(timeout);
		unsubscribe();
	});
</script>

{#if toastData}
	<div
		in:fade={{ duration: 200 }}
		out:fade={{ duration: 200 }}
		class="fixed bottom-4 left-1/2 z-50 max-w-sm -translate-x-1/2 rounded px-4 py-2 text-center text-white shadow-lg"
		class:bg-green-500={toastData.type === 'success'}
		class:bg-red-500={toastData.type === 'error'}
		class:bg-blue-500={toastData.type === 'loading'}
	>
		{toastData.message}
	</div>
{/if}
