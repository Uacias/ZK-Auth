<script lang="ts">
	import Input from '$lib/ui/Input.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Card from '$lib/ui/Card.svelte';
	import { api } from '$lib/utils/api';
	import { wrapWithToast } from '$lib/utils/toast';

	let username = '';
	let password = '';

	async function handleLogin() {
		await wrapWithToast(
			async () => {
				const user = await api<{ id: string; name: string }>('http://localhost:8080/auth/login', {
					method: 'POST',
					body: JSON.stringify({ name: username, password })
				});
				console.log('Login success:', user);
				username = '';
				password = '';
			},
			{
				loading: 'Logging in...',
				success: 'Logged in successfully!',
				error: 'Login failed'
			}
		);
	}
</script>

<Card title="Login" class_="mt-3">
	<form on:submit|preventDefault={handleLogin} class="mt-4 flex flex-col gap-3">
		<Input type="text" bind:value={username} placeholder="Username" autocomplete="username" />
		<Input
			type="password"
			bind:value={password}
			placeholder="Password"
			autocomplete="current-password"
		/>
		<Button text="Log In" onClick={handleLogin} class_="mt-2" />
	</form>
</Card>
