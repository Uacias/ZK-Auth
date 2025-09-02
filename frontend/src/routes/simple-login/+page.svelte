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

<div class="content">
	<h2 class="text-primary mb-4 text-2xl font-bold">Simple Login</h2>
	
	<Card title="Login" class_="max-w-md mx-auto">
		<div class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm mb-6">
			<h4 class="font-semibold text-red-900 dark:text-red-100 mb-2">Simple Authentication</h4>
			<p class="text-red-800 dark:text-red-200">
				Plain text passwords are sent to the server. This method is for testing purposes only.
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
				autocomplete="current-password"
			/>
			
			<Button type="submit" variant="primary" {loading} class_="mt-2">
				{#if loading}
					Logging in...
				{:else}
					Login
				{/if}
			</Button>
		</form>

		<div class="mt-6 text-center">
			<p class="text-sm text-secondary">
				Don't have an account?
				<a href="/simple-register" class="text-primary hover:underline">
					Register
				</a>
			</p>
		</div>

		<div class="mt-4 text-center">
			<p class="text-xs text-secondary mb-2">
				Other authentication methods:
			</p>
			<div class="flex justify-center space-x-4">
				<a href="/hash-login" class="text-xs text-primary hover:underline">
					Hash Auth
				</a>
				<a href="/string-zk-auth" class="text-xs text-primary hover:underline">
					ZK Auth
				</a>
			</div>
		</div>
	</Card>
</div>
