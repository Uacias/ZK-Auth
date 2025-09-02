<script lang="ts">
	import { goto } from '$app/navigation';
	import Card from '$lib/ui/Card.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Button from '$lib/ui/Button.svelte';
	import { api } from '$lib/utils/api';
	import { addToast } from '$lib/utils/toast';

	let username = '';
	let password = '';
	let loading = false;

	async function handleSubmit() {
		if (!username || !password) {
			addToast('Please fill in all fields', 'error');
			return;
		}

		loading = true;
		try {
			await api<{ name: string }>('http://localhost:8080/auth/register', {
				method: 'POST',
				body: JSON.stringify({ name: username, password })
			});
			
			addToast('Registration successful!', 'success');
			goto('/simple-login');
		} catch (error: any) {
			addToast(error.message || 'Registration failed', 'error');
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Simple Register - ZK Auth Demo</title>
</svelte:head>

<div class="content">
	<h2 class="text-primary mb-4 text-2xl font-bold">Simple Register</h2>
	
	<Card title="Create Account" class_="max-w-md mx-auto">
		<div class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm mb-6">
			<h4 class="font-semibold text-red-900 dark:text-red-100 mb-2">Simple Authentication</h4>
			<p class="text-red-800 dark:text-red-200">
				Plain text passwords are sent to the server. This method is for testing purposes only and should not be used in production.
			</p>
		</div>

		<form on:submit|preventDefault={handleSubmit} class="flex flex-col gap-3">
			<Input
				type="text"
				bind:value={username}
				placeholder="Username"
				autocomplete="username"
			/>
			
			<Input
				type="password"
				bind:value={password}
				placeholder="Password"
				autocomplete="new-password"
			/>
			
			<Button type="submit" variant="primary" {loading} class_="mt-2">
				{#if loading}
					Registering...
				{:else}
					Register
				{/if}
			</Button>
		</form>

		<div class="mt-6 text-center">
			<p class="text-sm text-secondary">
				Already have an account?
				<a href="/simple-login" class="text-primary hover:underline">
					Login
				</a>
			</p>
		</div>

		<div class="mt-4 text-center">
			<p class="text-xs text-secondary mb-2">
				Other authentication methods:
			</p>
			<div class="flex justify-center space-x-4">
				<a href="/hash-register" class="text-xs text-primary hover:underline">
					Hash Auth
				</a>
				<a href="/string-zk-auth" class="text-xs text-primary hover:underline">
					ZK Auth
				</a>
			</div>
		</div>
	</Card>
</div>
