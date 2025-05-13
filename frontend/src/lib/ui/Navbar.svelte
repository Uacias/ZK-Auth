<script lang="ts">
	import ToggleTheme from './ToggleTheme.svelte';
	import { goto } from '$app/navigation';
</script>

<nav
	class="fixed top-0 right-0 left-0 flex w-full items-center justify-between border-b border-gray-700 px-4 py-2"
>
	<a href="/" class="text-primary text-xl font-bold">ZK-Auth</a>

	<div class="flex items-center gap-4">
		<button on:click={() => goto('/simple-register')} class="text-secondary hover:underline">
			Register
		</button>
		<button on:click={() => goto('/simple-login')} class="text-secondary hover:underline">
			Login
		</button>
		<button on:click={() => goto('/hash-register')} class="text-secondary hover:underline">
			Hash Register
		</button>
		<button on:click={() => goto('/hash-login')} class="text-secondary hover:underline">
			Hash Login
		</button>

		<ToggleTheme />
	</div>
</nav>
