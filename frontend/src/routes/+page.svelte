<script lang="ts">
	import LoginForm from '$lib/ui/LoginForm.svelte';
</script>

<div class="flex min-h-screen flex-col items-center justify-center">
	<h1 class="text-primary text-4xl font-bold">Hello ZK-Auth!</h1>
	<p class="text-secondary mt-2 text-lg">Private authentication with Zero-Knowledge Proof</p>

	<LoginForm />
</div>
