<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/ui/Navbar.svelte';
	import Toast from '$lib/ui/Toast.svelte';
</script>

<main class="grid-layout">
	<header>
		<Navbar />
	</header>

	<div class="content">
		<slot />
	</div>
	<Toast />
</main>
