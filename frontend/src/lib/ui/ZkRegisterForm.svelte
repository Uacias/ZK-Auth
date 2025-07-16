<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { zkRegister, type ZkRegisterRequest } from '$lib/utils/api';
	import { generateSalt, generateCommitment } from '$lib/utils/zk';
	import { addToast } from '$lib/utils/toast';
	import Button from './Button.svelte';
	import Input from './Input.svelte';

	const dispatch = createEventDispatcher();

	let username = '';
	let password = '';
	let confirmPassword = '';
	let loading = false;

	async function handleSubmit() {
		if (!username || !password || !confirmPassword) {
			addToast('Please fill in all fields', 'error');
			return;
		}

		if (password !== confirmPassword) {
			addToast('Passwords do not match', 'error');
			return;
		}

		if (username.length < 3) {
			addToast('Username must be at least 3 characters long', 'error');
			return;
		}

		if (password.length < 6) {
			addToast('Password must be at least 6 characters long', 'error');
			return;
		}

		loading = true;

		try {
			// Generate salt and commitment for ZK authentication
			const salt = generateSalt();
			const commitment = await generateCommitment(password, salt);

			const registerData: ZkRegisterRequest = {
				username,
				salt,
				commitment
			};

			const result = await zkRegister(registerData);
			
			addToast(`ZK User registered successfully! ID: ${result.id}`, 'success');
			dispatch('success', result);
			
			// Clear form
			username = '';
			password = '';
			confirmPassword = '';
		} catch (error: any) {
			console.error('ZK Registration error:', error);
			addToast(error.message || 'Registration failed', 'error');
		} finally {
			loading = false;
		}
	}
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-4">
	<Input
		label="Username"
		type="text"
		bind:value={username}
		placeholder="Enter your username"
		required
	/>
	
	<Input
		label="Password"
		type="password"
		bind:value={password}
		placeholder="Enter your password"
		required
	/>
	
	<Input
		label="Confirm Password"
		type="password"
		bind:value={confirmPassword}
		placeholder="Confirm your password"
		required
	/>
	
	<Button type="submit" variant="primary" {loading} class_="w-full">
		{#if loading}
			Generating ZK Commitment...
		{:else}
			Register with ZK
		{/if}
	</Button>
</form>

<div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
	<h4 class="font-semibold text-blue-900 dark:text-blue-100 mb-2">Zero-Knowledge Registration</h4>
	<p class="text-blue-800 dark:text-blue-200">
		Your password will be used to generate a cryptographic commitment. 
		The actual password is never sent to the server - only the commitment is stored.
	</p>
</div>