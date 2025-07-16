<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { zkGetChallenge, zkGetSalt, zkLogin, type ZkLoginRequest } from '$lib/utils/api';
	import { generateZkProof, generateCommitment } from '$lib/utils/zk';
	import { addToast } from '$lib/utils/toast';
	import Button from './Button.svelte';
	import Input from './Input.svelte';

	const dispatch = createEventDispatcher();

	let username = '';
	let password = '';
	let loading = false;
	let currentStep = 'credentials'; // 'credentials' | 'generating-proof' | 'verifying'

	async function handleSubmit() {
		if (!username || !password) {
			addToast('Please fill in all fields', 'error');
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
		currentStep = 'generating-proof';

		try {
			// Step 1: Get user's salt from server
			addToast('Retrieving user salt...', 'info');
			const salt = await zkGetSalt(username);
			
			// Step 2: Get challenge from server
			addToast('Requesting challenge from server...', 'info');
			const challenge = await zkGetChallenge(username);
			
			// Step 3: Generate commitment using salt
			const commitment = generateCommitment(password, salt);
			
			// Step 4: Generate ZK proof
			addToast('Generating zero-knowledge proof...', 'info');
			const proof = await generateZkProof(password, salt, challenge.nonce, commitment);
			
			currentStep = 'verifying';
			
			// Step 5: Submit proof for verification
			addToast('Submitting proof for verification...', 'info');
			const loginData: ZkLoginRequest = {
				username,
				proof,
				nonce: challenge.nonce
			};

			const result = await zkLogin(loginData);
			
			addToast(`ZK Login successful! Welcome ${result.username}`, 'success');
			dispatch('success', result);
			
			// Clear form
			username = '';
			password = '';
		} catch (error: any) {
			console.error('ZK Login error:', error);
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
				return 'Login with ZK';
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
		disabled={loading}
	/>
	
	<Input
		label="Password"
		type="password"
		bind:value={password}
		placeholder="Enter your password"
		required
		disabled={loading}
	/>
	
	<Button type="submit" variant="primary" {loading} class_="w-full">
		{getButtonText()}
	</Button>
</form>

<div class="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm">
	<h4 class="font-semibold text-green-900 dark:text-green-100 mb-2">Zero-Knowledge Login</h4>
	<p class="text-green-800 dark:text-green-200 mb-2">
		Your password generates a zero-knowledge proof that proves you know the password
		without revealing it to the server.
	</p>
	
	{#if currentStep !== 'credentials'}
		<div class="mt-2 text-xs text-green-700 dark:text-green-300">
			<div class="flex items-center space-x-2">
				<div class="w-2 h-2 bg-green-500 rounded-full {currentStep === 'generating-proof' ? 'animate-pulse' : ''}"></div>
				<span class:opacity-50={currentStep !== 'generating-proof'}>Generating proof</span>
			</div>
			<div class="flex items-center space-x-2 mt-1">
				<div class="w-2 h-2 bg-green-500 rounded-full {currentStep === 'verifying' ? 'animate-pulse' : ''} {currentStep === 'credentials' ? 'opacity-50' : ''}"></div>
				<span class:opacity-50={currentStep !== 'verifying'}>Verifying with server</span>
			</div>
		</div>
	{/if}
</div>