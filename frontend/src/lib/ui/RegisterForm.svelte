<script lang="ts">
	import Input from '$lib/ui/Input.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Card from '$lib/ui/Card.svelte';
	import { api } from '$lib/utils/api';
	import { wrapWithToast } from '$lib/utils/toast';

	let username = '';
	let password = '';

	async function handleRegister() {
		await wrapWithToast(
			async () => {
				await api<{ name: string }>('http://localhost:8080/auth/register', {
					method: 'POST',
					body: JSON.stringify({ name: username, password })
				});
				username = '';
				password = '';
			},
			{
				loading: 'Registering...',
				success: '✅ Registered successfully!',
				error: '❌ Registration failed'
			}
		);
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
		<Button text="Register" onClick={handleRegister} class_="mt-2" />
	</form>
</Card>
