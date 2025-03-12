<script lang="ts">
	import Input from '$lib/ui/Input.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Card from '$lib/ui/Card.svelte';

	let username = '';
	let password = '';
	let errorMessage = '';

	function handleLogin() {
		if (username.trim() === '' || password.trim() === '') {
			errorMessage = 'Username and password are required!';
			return;
		}
		if (password.length < 6) {
			errorMessage = 'Password must be at least 6 characters long!';
			return;
		}

		console.log('Logging in with:', { username, password });
		errorMessage = '';
	}
</script>

<Card title="Login" class_="mt-3">
	<form on:submit|preventDefault={handleLogin} class="mt-4 flex flex-col gap-3">
		<Input type="text" bind:value={username} placeholder="Username" />
		<Input type="password" bind:value={password} placeholder="Password" />
		{#if errorMessage}
			<p class="text-sm text-red-500">{errorMessage}</p>
		{/if}
		<Button text="Log In" onClick={handleLogin} class_="mt-2" />
	</form>
</Card>
