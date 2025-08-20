<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { zkGetChallenge, zkGetSalt, zkLogin, type ZkLoginRequest } from '$lib/utils/api';
	import { generateZkProof, generateCommitment } from '$lib/utils/zk';
	import { addToast } from '$lib/utils/toast';
	import Button from './Button.svelte';
	import Input from './Input.svelte';

	const dispatch = createEventDispatcher();

	let numericUserId = '';
	let numericPassword = '';
	let loading = false;
	let currentStep = 'credentials';

	async function handleSubmit() {
		if (!numericUserId || !numericPassword) {
			addToast('Please fill in all fields', 'error');
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

		loading = true;
		currentStep = 'generating-proof';

		try {
			// Step 1: Get user's salt from server
			addToast('Retrieving user salt...', 'info');
			const salt = await zkGetSalt(numericUserId);
			console.log('Retrieved salt:', salt);
			
			// Step 2: Get challenge from server
			addToast('Requesting challenge from server...', 'info');
			const challenge = await zkGetChallenge(numericUserId);
			console.log('Retrieved challenge:', challenge);
			
			// Step 3: Generate expected hash (same as during registration)
			const expectedHash = await generateCommitment(numericPassword, salt, numericUserId);
			console.log('Generated expected hash:', expectedHash);
			
			// Step 4: Generate ZK proof using new auth circuit
			addToast('Generating zero-knowledge proof...', 'info');
			const proof = await generateZkProof(numericPassword, salt, numericUserId, expectedHash);
			console.log('Generated proof length:', proof.length);
			
			currentStep = 'verifying';
			
			// Step 5: Submit proof for verification
			addToast('Submitting proof for verification...', 'info');
			const loginData: ZkLoginRequest = {
				username: numericUserId,
				proof,
				nonce: challenge.nonce
			};

			const result = await zkLogin(loginData);
			
			addToast(`Numeric ZK Login successful! Welcome ${result.username}`, 'success');
			dispatch('success', result);
			
			// Clear form
			numericUserId = '';
			numericPassword = '';
		} catch (error: any) {
			console.error('Numeric ZK Login error:', error);
			addToast(error.message || 'Login failed', 'error');
		} finally {
			loading = false;
			currentStep = 'credentials';
		}
	}

	function getButtonText() {
		switch (currentStep) {
			case 'generating-proof':
				return 'Generating ZK Proof...';
			case 'verifying':
				return 'Verifying Proof...';
			default:
				return 'Login with Numeric ZK';
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
		disabled={loading}
	/>
	
	<Input
		label="Numeric Password"
		type="text"
		bind:value={numericPassword}
		placeholder="987654321"
		required
		pattern="[0-9]*"
		inputmode="numeric"
		disabled={loading}
	/>
	
	<Button type="submit" variant="primary" {loading} class="w-full">
		{getButtonText()}
	</Button>
</form>

<div class="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm">
	<h4 class="font-semibold text-green-900 dark:text-green-100 mb-2">Numeric Zero-Knowledge Login</h4>
	<p class="text-green-800 dark:text-green-200 mb-2">
		Pure numeric ZK proof generation - no string conversion overhead!
	</p>
	
	{#if currentStep !== 'credentials'}
		<div class="mt-2 text-xs text-green-700 dark:text-green-300">
			<div class="flex items-center space-x-2">
				<div class="w-2 h-2 bg-green-500 rounded-full {currentStep === 'generating-proof' ? 'animate-pulse' : ''}"></div>
				<span class:opacity-50={currentStep !== 'generating-proof'}>Generating ZK proof</span>
			</div>
			<div class="flex items-center space-x-2 mt-1">
				<div class="w-2 h-2 bg-green-500 rounded-full {currentStep === 'verifying' ? 'animate-pulse' : ''} {currentStep === 'credentials' ? 'opacity-50' : ''}"></div>
				<span class:opacity-50={currentStep !== 'verifying'}>Verifying with server</span>
			</div>
		</div>
	{/if}
	
	<div class="mt-3 text-xs text-green-600 dark:text-green-400">
		<p class="font-medium">Circuit Parameters:</p>
		<ul class="space-y-1 mt-1">
			<li>• password: {numericPassword || 'your_password'} (private)</li>
			<li>• salt: from_server (public)</li>
			<li>• user_id: {numericUserId || 'your_user_id'} (public)</li>
			<li>• expected_hash: computed_locally (public)</li>
		</ul>
	</div>
</div>