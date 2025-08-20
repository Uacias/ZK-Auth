<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { zkRegister, type ZkRegisterRequest } from '$lib/utils/api';
	import { generateSalt, generateStringCommitment, stringToField } from '$lib/utils/zk';
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

		// Pre-validate string lengths (catches errors early)
		try {
			stringToField(username);
			stringToField(password);
		} catch (error: any) {
			if (error.message.includes('String too long')) {
				addToast(error.message, 'error');
				return;
			}
			addToast('String validation failed: ' + error.message, 'error');
			return;
		}

		loading = true;

		try {
			// Generate salt 
			const salt = generateSalt();
			console.log('Generated salt:', salt);
			
			// Generate commitment using string values
			const commitment = await generateStringCommitment(password, salt, username);
			console.log('Generated commitment:', commitment);

			const registerData: ZkRegisterRequest = {
				username,
				salt,
				commitment
			};

			const result = await zkRegister(registerData);
			
			addToast(`ZK User registered! Welcome ${result.username}`, 'success');
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
		placeholder="alice"
		required
		maxlength="30"
	/>
	
	<Input
		label="Password"
		type="password"
		bind:value={password}
		placeholder="secret123"
		required
		maxlength="30"
	/>
	
	<Input
		label="Confirm Password"
		type="password"
		bind:value={confirmPassword}
		placeholder="secret123"
		required
		maxlength="30"
	/>
	
	<Button type="submit" variant="primary" {loading} class="w-full">
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
		Your password will be used to generate a cryptographic commitment. The actual password is never sent to the server - only the commitment is stored.
	</p>
</div>