<script lang="ts">
	import Input from '$lib/ui/Input.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Card from '$lib/ui/Card.svelte';

	let username = '';
	let password = '';

	function handleLogin() {
		console.log('Logging in with:', { username, password });
	}
</script>

<Card title="Login" class_="mt-3">
	<form on:submit|preventDefault={handleLogin} class="mt-4 flex flex-col gap-3">
		<Input type="text" bind:value={username} placeholder="Username" />
		<Input type="password" bind:value={password} placeholder="Password" />
		<Button text="Log In" onClick={handleLogin} class_="mt-2" />
	</form>
</Card>
