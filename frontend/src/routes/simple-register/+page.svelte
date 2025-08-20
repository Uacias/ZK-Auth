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

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
	<Card class="w-full max-w-md">
		<div class="text-center mb-6">
			<h1 class="text-2xl font-bold text-gray-900 dark:text-white">
				Simple Registration
			</h1>
			<p class="text-gray-600 dark:text-gray-400 mt-2">
				Create account with plain text credentials
			</p>
		</div>

		<form on:submit|preventDefault={handleSubmit} class="space-y-4">
			<Input
				label="Username"
				type="text"
				bind:value={username}
				placeholder="Enter your username"
				required
				autocomplete="username"
			/>
			
			<Input
				label="Password"
				type="password"
				bind:value={password}
				placeholder="Enter your password"
				required
				autocomplete="new-password"
			/>
			
			<Button type="submit" variant="primary" {loading} class="w-full">
				{#if loading}
					Registering...
				{:else}
					Register
				{/if}
			</Button>
		</form>

		<div class="mt-6 text-center">
			<p class="text-sm text-gray-600 dark:text-gray-400">
				Already have an account?
				<a href="/simple-login" class="text-blue-600 dark:text-blue-400 hover:underline">
					Login
				</a>
			</p>
		</div>

		<div class="mt-6 text-center">
			<p class="text-xs text-gray-500 dark:text-gray-500">
				Other authentication methods:
			</p>
			<div class="flex justify-center space-x-4 mt-2">
				<a href="/hash-register" class="text-xs text-blue-600 dark:text-blue-400 hover:underline">
					Hash Auth
				</a>
				<a href="/string-zk-register" class="text-xs text-blue-600 dark:text-blue-400 hover:underline">
					ZK Auth
				</a>
			</div>
		</div>

		<div class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm">
			<h4 class="font-semibold text-red-900 dark:text-red-100 mb-2">Simple Authentication</h4>
			<p class="text-red-800 dark:text-red-200">
				Plain text passwords are sent to the server. This method is for testing purposes only and should not be used in production.
			</p>
		</div>
	</Card>
</div>
