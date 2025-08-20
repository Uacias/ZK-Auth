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
			console.log('Generated string commitment:', commitment);

			const registerData: ZkRegisterRequest = {
				username, // Send actual string username to backend
				salt,
				commitment
			};

			const result = await zkRegister(registerData);
			
			addToast(`String ZK User registered! Welcome ${result.username}`, 'success');
			dispatch('success', result);
			
			// Clear form
			username = '';
			password = '';
			confirmPassword = '';
		} catch (error: any) {
			console.error('String ZK Registration error:', error);
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
			Generating String ZK Commitment...
		{:else}
			Register with String ZK
		{/if}
	</Button>
</form>

<div class="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-sm">
	<h4 class="font-semibold text-purple-900 dark:text-purple-100 mb-2">String Zero-Knowledge Registration</h4>
	<p class="text-purple-800 dark:text-purple-200 mb-2">
		Use actual strings for username and password - with BN254 field validation!
	</p>
	<ul class="text-xs text-purple-700 dark:text-purple-300 space-y-1">
		<li>• Username: String (max 30 chars, e.g., "alice")</li>
		<li>• Password: String (max 30 chars, e.g., "secret123")</li>
		<li>• Uses Poseidon hashing with multi-layer security</li>
		<li>• Strings converted to BN254 field elements</li>
		<li>• Password never sent to server - only commitment</li>
	</ul>
</div>