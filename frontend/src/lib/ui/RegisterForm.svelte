<script lang="ts">
	import Input from '$lib/ui/Input.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Card from '$lib/ui/Card.svelte';

	let username = '';
	let password = '';
	let errorMessage = '';
	let successMessage = '';

	async function handleRegister() {
		errorMessage = '';
		successMessage = '';

		if (username.trim() === '' || password.trim() === '') {
			errorMessage = 'Username and password are required!';
			return;
		}
		if (password.length < 6) {
			errorMessage = 'Password must be at least 6 characters long!';
			return;
		}

		try {
			const res = await fetch('http://0.0.0.0:8080/auth/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ name: username, password })
			});

			if (!res.ok) {
				const err = await res.text();
				throw new Error(err);
			}

			const user = await res.json();
			successMessage = `✅ Registered user "${user.name}" successfully`;
			username = '';
			password = '';
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : String(err);
			console.error('❌ Register error:', errorMessage);
		}
	}
</script>

<Card title="Register" class_="mt-3">
	<form on:submit|preventDefault={handleRegister} class="mt-4 flex flex-col gap-3">
		<Input type="text" bind:value={username} placeholder="Username" autocomplete="username" />
		<Input
			type="password"
			bind:value={password}
			placeholder="Password"
			autocomplete="current-password"
		/>
		{#if errorMessage}
			<p class="text-sm text-red-500">{errorMessage}</p>
		{/if}

		{#if successMessage}
			<p class="text-sm text-green-500">{successMessage}</p>
		{/if}

		<Button text="Register" onClick={handleRegister} class_="mt-2" />
	</form>
</Card>
