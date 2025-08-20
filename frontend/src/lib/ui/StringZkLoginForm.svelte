<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { zkGetChallenge, zkGetSalt, zkLogin, type ZkLoginRequest } from '$lib/utils/api';
	import { generateStringZkProof, generateStringCommitment, stringToField } from '$lib/utils/zk';
	import { addToast } from '$lib/utils/toast';
	import Button from './Button.svelte';
	import Input from './Input.svelte';

	const dispatch = createEventDispatcher();

	let username = '';
	let password = '';
	let loading = false;
	let currentStep = 'credentials';

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

		// Pre-validate string lengths
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
		currentStep = 'generating-proof';

		try {
			// Step 1: Get user's salt from server
			addToast('Retrieving user salt...', 'info');
			const salt = await zkGetSalt(username);
			console.log('Retrieved salt:', salt);
			
			// Step 2: Get challenge from server
			addToast('Requesting challenge from server...', 'info');
			const challenge = await zkGetChallenge(username);
			console.log('Retrieved challenge:', challenge);
			
			// Step 3: Generate expected hash (same as during registration)
			const expectedHash = await generateStringCommitment(password, salt, username);
			console.log('Generated expected hash:', expectedHash);
			
			// Step 4: Generate ZK proof using string auth circuit
			addToast('Generating zero-knowledge proof...', 'info');
			const proof = await generateStringZkProof(password, salt, username, expectedHash);
			console.log('Generated string proof length:', proof.length);
			
			currentStep = 'verifying';
			
			// Step 5: Submit proof for verification
			addToast('Submitting proof for verification...', 'info');
			const loginData: ZkLoginRequest = {
				username,
				proof,
				nonce: challenge.nonce
			};

			const result = await zkLogin(loginData);
			
			addToast(`String ZK Login successful! Welcome ${result.username}`, 'success');
			dispatch('success', result);
			
			// Clear form
			username = '';
			password = '';
		} catch (error: any) {
			console.error('String ZK Login error:', error);
			addToast(error.message || 'Login failed', 'error');
		} finally {
			loading = false;
			currentStep = 'credentials';
		}
	}

	function getButtonText() {
		switch (currentStep) {
			case 'generating-proof':
				return 'Generating String ZK Proof...';
			case 'verifying':
				return 'Verifying Proof...';
			default:
				return 'Login with String ZK';
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
		disabled={loading}
	/>
	
	<Input
		label="Password"
		type="password"
		bind:value={password}
		placeholder="secret123"
		required
		maxlength="30"
		disabled={loading}
	/>
	
	<Button type="submit" variant="primary" {loading} class="w-full">
		{getButtonText()}
	</Button>
</form>

<div class="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-sm">
	<h4 class="font-semibold text-purple-900 dark:text-purple-100 mb-2">String Zero-Knowledge Login</h4>
	<p class="text-purple-800 dark:text-purple-200 mb-2">
		String ZK proof generation with BN254 field validation!
	</p>
	
	{#if currentStep !== 'credentials'}
		<div class="mt-2 text-xs text-purple-700 dark:text-purple-300">
			<div class="flex items-center space-x-2">
				<div class="w-2 h-2 bg-purple-500 rounded-full {currentStep === 'generating-proof' ? 'animate-pulse' : ''}"></div>
				<span class:opacity-50={currentStep !== 'generating-proof'}>Generating string ZK proof</span>
			</div>
			<div class="flex items-center space-x-2 mt-1">
				<div class="w-2 h-2 bg-purple-500 rounded-full {currentStep === 'verifying' ? 'animate-pulse' : ''} {currentStep === 'credentials' ? 'opacity-50' : ''}"></div>
				<span class:opacity-50={currentStep !== 'verifying'}>Verifying with server</span>
			</div>
		</div>
	{/if}
	
	<div class="mt-3 text-xs text-purple-600 dark:text-purple-400">
		<p class="font-medium">String → Field Conversion:</p>
		<ul class="space-y-1 mt-1">
			<li>• password: "{password || 'your_password'}" → stringToField() (private)</li>
			<li>• salt: from_server (public)</li>
			<li>• username: "{username || 'your_username'}" → stringToField() (public)</li>
			<li>• expected_hash: computed_locally (public)</li>
		</ul>
	</div>
</div>