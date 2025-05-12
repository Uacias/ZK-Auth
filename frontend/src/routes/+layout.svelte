<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/ui/Navbar.svelte';
	import Toasts from '$lib/ui/Toasts.svelte';
</script>

<main class="grid-layout">
	<header>
		<Navbar />
	</header>

	<div class="content">
		<slot />
	</div>
	<Toasts />
</main>
