<script>
	import { UltraHonkBackend } from '@aztec/bb.js';
	import { Noir } from '@noir-lang/noir_js';
	import { init, poseidonHashBN254 } from 'garaga';
	import Card from '$lib/ui/Card.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Button from '$lib/ui/Button.svelte';
	import { addToast } from '$lib/utils/toast.js';

	let username = '';
	let password = '';
	let salt = '';
	let loading = false;
	let garagaInitialized = false;
	let isRegistered = false;
	let mode = 'register'; // 'register' or 'login'

	// Initialize Garaga WASM module
	async function initGaraga() {
		if (!garagaInitialized) {
			try {
				await init();
				garagaInitialized = true;
			} catch (error) {
				throw new Error(`Failed to initialize Garaga: ${error.message}`);
			}
		}
	}

	// Convert string to BigInt (max 15 chars)
	function stringToBigInt(str) {
		if (str.length > 15) {
			throw new Error(`String too long! Max 15 characters. Got: ${str.length}`);
		}
		
		let result = 0n;
		for (let i = 0; i < str.length; i++) {
			result = result * 256n + BigInt(str.charCodeAt(i));
		}
		return result;
	}

	// Generate random salt
	function generateSalt() {
		const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		let result = '';
		for (let i = 0; i < 8; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return result;
	}

	// Calculate commitment hash using Garaga Poseidon
	async function calculateCommitment(password, username, salt) {
		await initGaraga();
		
		// Convert strings to BigInt
		const passwordBigInt = stringToBigInt(password);
		const usernameBigInt = stringToBigInt(username);
		const saltBigInt = stringToBigInt(salt);
		
		console.log('Calculating commitment for:');
		console.log('Password:', password, '→', passwordBigInt.toString());
		console.log('Username:', username, '→', usernameBigInt.toString());
		console.log('Salt:', salt, '→', saltBigInt.toString());
		
		// Hash password with salt first: Poseidon(password, salt)
		const passwordSaltHash = poseidonHashBN254(passwordBigInt, saltBigInt);
		console.log('Password+Salt hash:', passwordSaltHash.toString());
		
		// Then hash with username: Poseidon(passwordSaltHash, username)  
		const finalHash = poseidonHashBN254(passwordSaltHash, usernameBigInt);
		console.log('Final commitment:', finalHash.toString());
		
		return finalHash;
	}

	// Generate ZK proof
	async function generateZkProof(password, username, salt, expectedHash) {
		try {
			console.log('🔧 Loading ZK circuit...');

			// Load the compiled auth circuit
			const response = await fetch('/zk.json');
			const circuit = await response.json();

			console.log('🔧 Initializing Noir and Barretenberg...');
			const noir = new Noir(circuit);
			const backend = new UltraHonkBackend(circuit.bytecode);

			// Prepare circuit inputs
			const inputs = {
				password: stringToBigInt(password).toString(),
				username: stringToBigInt(username).toString(),
				salt: stringToBigInt(salt).toString(),
				expected_hash: expectedHash
			};

			console.log('📊 Circuit inputs:', inputs);

			console.log('⚡ Generating witness...');
			const { witness } = await noir.execute(inputs);
			
			console.log('🔐 Generating ZK proof...');
			const proofResult = await backend.generateProof(witness);
			
			console.log('✅ ZK proof generated successfully!');
			return proofResult.proof;

		} catch (error) {
			console.error('❌ ZK proof generation failed:', error);
			throw new Error(`ZK proof generation failed: ${error.message}`);
		}
	}

	async function handleRegister() {
		if (!username || !password) {
			addToast('Please enter username and password', 'error');
			return;
		}

		if (username.length > 15 || password.length > 15) {
			addToast('Username and password must be max 15 characters', 'error');
			return;
		}

		loading = true;
		
		try {
			// Generate salt if not provided
			if (!salt) {
				salt = generateSalt();
				addToast(`Generated salt: ${salt}`, 'info');
			}

			addToast('Calculating commitment...', 'info');
			const commitmentBigInt = await calculateCommitment(password, username, salt);
			
			// Convert to BigInt strings for API
			const usernameBigInt = stringToBigInt(username).toString();
			const saltBigInt = stringToBigInt(salt).toString();
			const commitmentBigIntStr = commitmentBigInt.toString();

			console.log('Sending to backend:', {
				usernameBigInt,
				saltBigInt, 
				commitmentBigInt: commitmentBigIntStr
			});

			addToast('Registering with backend...', 'info');
			const response = await fetch('http://localhost:8080/auth/zk/register_bigint', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					usernameBigInt,
					saltBigInt,
					commitmentBigInt: commitmentBigIntStr
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Registration failed');
			}

			const user = await response.json();
			console.log('Registration successful:', user);
			
			addToast('Registration successful! ✅', 'success');
			isRegistered = true;
			mode = 'login';

		} catch (error) {
			console.error('Registration error:', error);
			addToast(error.message || 'Registration failed', 'error');
		} finally {
			loading = false;
		}
	}

	async function handleLogin() {
		if (!username || !password) {
			addToast('Please enter username and password', 'error');
			return;
		}

		loading = true;
		
		try {
			// Calculate expected hash
			addToast('Calculating commitment...', 'info');
			const expectedHashBigInt = await calculateCommitment(password, username, salt);
			const expectedHash = expectedHashBigInt.toString();

			// Generate ZK proof
			addToast('Generating ZK proof...', 'info');
			const proof = await generateZkProof(password, username, salt, expectedHash);

			// Convert username to BigInt string for API
			const usernameBigInt = stringToBigInt(username).toString();

			console.log('Sending login request:', {
				usernameBigInt,
				proof: Array.from(proof) // Convert Uint8Array to array
			});

			addToast('Verifying with backend...', 'info');
			const response = await fetch('http://localhost:8080/auth/zk/login_bigint', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					usernameBigInt,
					proof: Array.from(proof)
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Login failed');
			}

			const result = await response.json();
			console.log('Login successful:', result);
			
			addToast('Login successful! ✅', 'success');

		} catch (error) {
			console.error('Login error:', error);
			addToast(error.message || 'Login failed', 'error');
		} finally {
			loading = false;
		}
	}

	function handleGenerateSalt() {
		salt = generateSalt();
		addToast(`New salt generated: ${salt}`, 'info');
	}

	function switchMode() {
		mode = mode === 'register' ? 'login' : 'register';
	}
</script>

<svelte:head>
	<title>BigInt ZK Auth - ZK-Auth</title>
</svelte:head>

<div class="container mx-auto max-w-2xl px-4 py-8">
	<Card>
		<div class="text-center mb-6">
			<h1 class="text-3xl font-bold text-primary mb-2">🔐 BigInt ZK Auth</h1>
			<p class="text-secondary">
				Full registration and login flow with pure BigInt inputs
			</p>
		</div>

		<div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
			<h3 class="font-semibold text-blue-800 dark:text-blue-200 mb-2">How it works:</h3>
			<ul class="text-blue-700 dark:text-blue-300 text-sm space-y-1">
				<li>• All inputs converted to BigInt values</li>
				<li>• Register: stores username, salt, and commitment in backend</li>
				<li>• Login: generates ZK proof and verifies with backend</li>
				<li>• Hash: Poseidon(Poseidon(password, salt), username)</li>
			</ul>
		</div>

		<!-- Mode Switcher -->
		<div class="flex justify-center mb-6">
			<div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex">
				<button 
					class="px-4 py-2 rounded-md font-medium transition-colors {mode === 'register' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}"
					onclick={() => mode = 'register'}
					disabled={loading}
				>
					Register
				</button>
				<button 
					class="px-4 py-2 rounded-md font-medium transition-colors {mode === 'login' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}"
					onclick={() => mode = 'login'}
					disabled={loading}
				>
					Login
				</button>
			</div>
		</div>

		<!-- Form -->
		<div class="space-y-4">
			<h3 class="text-lg font-semibold text-primary">
				{mode === 'register' ? 'Create Account' : 'Login'}
			</h3>
			
			<Input
				label="Username"
				bind:value={username}
				placeholder="Enter username (max 15 chars)"
				maxlength="15"
				disabled={loading}
			/>

			<Input
				label="Password"
				type="password"
				bind:value={password}
				placeholder="Enter password (max 15 chars)"
				maxlength="15"
				disabled={loading}
			/>

			<div class="flex gap-2">
				<Input
					label="Salt"
					bind:value={salt}
					placeholder="Salt (auto-generated)"
					maxlength="15"
					disabled={loading}
					class="flex-1"
				/>
				<Button 
					type="button" 
					onclick={handleGenerateSalt}
					disabled={loading}
					class_="mt-6"
				>
					{#snippet children()}Generate{/snippet}
				</Button>
			</div>

			<Button 
				type="button" 
				onclick={mode === 'register' ? handleRegister : handleLogin}
				disabled={loading || !username || !password}
				class_="w-full"
			>
				{#snippet children()}
					{#if loading}
						{mode === 'register' ? 'Registering...' : 'Logging in...'}
					{:else}
						{mode === 'register' ? 'Register' : 'Login'}
					{/if}
				{/snippet}
			</Button>
		</div>

		<div class="mt-6 text-center">
			<a href="/" class="text-secondary hover:text-primary underline">← Back to Home</a>
		</div>
	</Card>
</div>

<style>
	.container {
		min-height: calc(100vh - 4rem);
		padding-top: 2rem;
	}
</style>