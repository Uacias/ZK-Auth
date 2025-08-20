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
			await api<{ name: string }>('http://localhost:8080/auth/login', {
				method: 'POST',
				body: JSON.stringify({ name: username, password })
			});
			
			addToast(`Login successful! Welcome ${username}`, 'success');
			goto('/');
		} catch (error: any) {
			addToast(error.message || 'Login failed', 'error');
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Simple Login - ZK Auth Demo</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
	<Card class="w-full max-w-md">
		<div class="text-center mb-6">
			<h1 class="text-2xl font-bold text-gray-900 dark:text-white">
				Simple Login
			</h1>
			<p class="text-gray-600 dark:text-gray-400 mt-2">
				Authenticate with plain text credentials
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
				autocomplete="current-password"
			/>
			
			<Button type="submit" variant="primary" {loading} class="w-full">
				{#if loading}
					Logging in...
				{:else}
					Login
				{/if}
			</Button>
		</form>

		<div class="mt-6 text-center">
			<p class="text-sm text-gray-600 dark:text-gray-400">
				Don't have an account?
				<a href="/simple-register" class="text-blue-600 dark:text-blue-400 hover:underline">
					Register
				</a>
			</p>
		</div>

		<div class="mt-6 text-center">
			<p class="text-xs text-gray-500 dark:text-gray-500">
				Other authentication methods:
			</p>
			<div class="flex justify-center space-x-4 mt-2">
				<a href="/hash-login" class="text-xs text-blue-600 dark:text-blue-400 hover:underline">
					Hash Auth
				</a>
				<a href="/string-zk-login" class="text-xs text-blue-600 dark:text-blue-400 hover:underline">
					ZK Auth
				</a>
			</div>
		</div>

		<div class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm">
			<h4 class="font-semibold text-red-900 dark:text-red-100 mb-2">Simple Authentication</h4>
			<p class="text-red-800 dark:text-red-200">
				Plain text passwords are sent to the server. This method is for testing purposes only.
			</p>
		</div>
	</Card>
</div>
