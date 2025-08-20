<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { zkRegister, type ZkRegisterRequest } from '$lib/utils/api';
	import { generateSalt, generateCommitment, generateUserId } from '$lib/utils/zk';
	import { addToast } from '$lib/utils/toast';
	import Button from './Button.svelte';
	import Input from './Input.svelte';

	const dispatch = createEventDispatcher();

	let numericUserId = '';
	let numericPassword = '';
	let confirmPassword = '';
	let loading = false;

	async function handleSubmit() {
		if (!numericUserId || !numericPassword || !confirmPassword) {
			addToast('Please fill in all fields', 'error');
			return;
		}

		if (numericPassword !== confirmPassword) {
			addToast('Passwords do not match', 'error');
			return;
		}

		// Validate numeric inputs
		if (!/^\d+$/.test(numericUserId)) {
			addToast('User ID must be numeric only', 'error');
			return;
		}

		if (!/^\d+$/.test(numericPassword)) {
			addToast('Password must be numeric only', 'error');
			return;
		}

		if (numericPassword.length < 6) {
			addToast('Password must be at least 6 digits long', 'error');
			return;
		}

		loading = true;

		try {
			// Generate salt 
			const salt = generateSalt();
			console.log('Generated salt:', salt);
			
			// Generate commitment using numeric values
			const commitment = await generateCommitment(numericPassword, salt, numericUserId);
			console.log('Generated commitment:', commitment);

			const registerData: ZkRegisterRequest = {
				username: numericUserId,
				salt,
				commitment
			};

			const result = await zkRegister(registerData);
			
			addToast(`Numeric ZK User registered! ID: ${result.id}`, 'success');
			dispatch('success', result);
			
			// Clear form
			numericUserId = '';
			numericPassword = '';
			confirmPassword = '';
		} catch (error: any) {
			console.error('Numeric ZK Registration error:', error);
			addToast(error.message || 'Registration failed', 'error');
		} finally {
			loading = false;
		}
	}
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-4">
	<Input
		label="Numeric User ID"
		type="text"
		bind:value={numericUserId}
		placeholder="123456789"
		required
		pattern="[0-9]*"
		inputmode="numeric"
	/>
	
	<Input
		label="Numeric Password"
		type="text"
		bind:value={numericPassword}
		placeholder="987654321"
		required
		pattern="[0-9]*"
		inputmode="numeric"
	/>
	
	<Input
		label="Confirm Password"
		type="text"
		bind:value={confirmPassword}
		placeholder="987654321"
		required
		pattern="[0-9]*"
		inputmode="numeric"
	/>
	
	<Button type="submit" variant="primary" {loading} class="w-full">
		{#if loading}
			Generating ZK Commitment...
		{:else}
			Register with Numeric ZK
		{/if}
	</Button>
</form>

<div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
	<h4 class="font-semibold text-blue-900 dark:text-blue-100 mb-2">Numeric Zero-Knowledge Registration</h4>
	<p class="text-blue-800 dark:text-blue-200 mb-2">
		Pure numeric authentication - no string conversions needed!
	</p>
	<ul class="text-xs text-blue-700 dark:text-blue-300 space-y-1">
		<li>• User ID: Any numeric value (e.g., 123456789)</li>
		<li>• Password: Numeric only (e.g., 987654321)</li>
		<li>• Uses Poseidon hashing with multi-layer security</li>
		<li>• Password is never sent to server - only commitment</li>
	</ul>
</div>