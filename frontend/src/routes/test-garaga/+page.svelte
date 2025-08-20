<script lang="ts">
	import { onMount } from 'svelte';
	import { init, poseidonHashBN254 } from 'garaga';
	import Button from '$lib/ui/Button.svelte';
	import Card from '$lib/ui/Card.svelte';

	let results: string[] = [];
	let loading = false;

	const BN254_FIELD_MODULUS = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

	function stringToBigInt(str: string): bigint {
		let result = 0n;
		for (let i = 0; i < str.length; i++) {
			result = result * 256n + BigInt(str.charCodeAt(i));
		}
		return result;
	}

	function log(message: string) {
		console.log(message);
		results = [...results, message];
	}

	async function runTests() {
		results = [];
		loading = true;
		
		log("🔧 Starting Garaga tests...");

		try {
			log("📦 Initializing Garaga WASM...");
			await init();
			log("✅ Garaga initialized successfully!");

			// Test Case 1: Short string that should fit in field
			const shortString = "alice";
			const shortBigInt = stringToBigInt(shortString);
			log(`📝 Short string: "${shortString}"`);
			log(`🔢 Short BigInt: ${shortBigInt}`);
			log(`✅ Short fits in field: ${shortBigInt < BN254_FIELD_MODULUS}`);

			try {
				const shortHash = poseidonHashBN254(shortBigInt, 12345n);
				log(`✅ Short string hash SUCCESS: ${shortHash}`);
			} catch (error: any) {
				log(`❌ Short string hash FAILED: ${error.message}`);
			}

			log("---");

			// Test Case 2: Medium string
			const mediumString = "this_is_medium_length_username";
			const mediumBigInt = stringToBigInt(mediumString);
			log(`📝 Medium string: "${mediumString}" (${mediumString.length} chars)`);
			log(`🔢 Medium BigInt: ${mediumBigInt}`);
			log(`✅ Medium fits in field: ${mediumBigInt < BN254_FIELD_MODULUS}`);

			try {
				const mediumHash = poseidonHashBN254(mediumBigInt, 12345n);
				log(`✅ Medium string hash SUCCESS: ${mediumHash}`);
			} catch (error: any) {
				log(`❌ Medium string hash FAILED: ${error.message}`);
			}

			log("---");

			// Test Case 3: Very long string that should exceed field
			const longString = "this_is_a_very_very_very_long_username_that_should_definitely_exceed_the_bn254_field_modulus_and_cause_an_error_when_converted_to_bigint_because_it_will_be_larger_than_maximum";
			const longBigInt = stringToBigInt(longString);
			log(`📝 Long string: "${longString}" (${longString.length} chars)`);
			log(`🔢 Long BigInt: ${longBigInt}`);
			log(`❌ Long exceeds field: ${longBigInt >= BN254_FIELD_MODULUS}`);

			try {
				const longHash = poseidonHashBN254(longBigInt, 12345n);
				log(`❌ Long string hash SUCCESS (unexpected): ${longHash}`);
			} catch (error: any) {
				log(`✅ Long string hash FAILED (expected): ${error.message}`);
			}

			log("---");

			// Test Case 4: Exactly at field modulus - 1
			const exactLimit = BN254_FIELD_MODULUS - 1n;
			log(`🔢 Exact limit test (modulus - 1): ${exactLimit}`);

			try {
				const exactHash = poseidonHashBN254(exactLimit, 12345n);
				log(`✅ Exact limit hash SUCCESS: ${exactHash}`);
			} catch (error: any) {
				log(`❌ Exact limit hash FAILED: ${error.message}`);
			}

			log("---");

			// Test Case 5: Just over field modulus
			const overLimit = BN254_FIELD_MODULUS + 1n;
			log(`🔢 Over limit test (modulus + 1): ${overLimit}`);

			try {
				const overHash = poseidonHashBN254(overLimit, 12345n);
				log(`❌ Over limit hash SUCCESS (unexpected): ${overHash}`);
			} catch (error: any) {
				log(`✅ Over limit hash FAILED (expected): ${error.message}`);
			}

		} catch (error: any) {
			log(`💥 Test failed: ${error.message}`);
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Garaga Poseidon Limits Test</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
	<div class="max-w-4xl mx-auto">
		<Card class="mb-6">
			<div class="text-center mb-6">
				<h1 class="text-2xl font-bold text-gray-900 dark:text-white">
					🧪 Garaga Poseidon Field Limits Test
				</h1>
				<p class="text-gray-600 dark:text-gray-400 mt-2">
					Testing BN254 field modulus limits with string-to-BigInt conversion
				</p>
			</div>

			<div class="text-center mb-6">
				<button 
					on:click={runTests} 
					disabled={loading}
					class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if loading}
						Running Tests...
					{:else}
						🚀 Run Garaga Tests
					{/if}
				</button>
			</div>

			{#if loading}
				<div class="text-center text-gray-600 dark:text-gray-400">
					<p>Initializing Garaga and running field limit tests...</p>
				</div>
			{/if}

			<div class="text-sm text-gray-500 dark:text-gray-400 mb-4">
				<p><strong>BN254 Field Modulus:</strong> {BN254_FIELD_MODULUS}</p>
			</div>
		</Card>

		{#if results.length > 0}
			<Card>
				<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Test Results:</h3>
				<div class="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
					{#each results as result}
						<div class="mb-1">{result}</div>
					{/each}
				</div>
			</Card>
		{/if}

		<div class="mt-6 text-center">
			<a href="/" class="text-blue-600 dark:text-blue-400 hover:underline">
				← Back to Home
			</a>
		</div>
	</div>
</div>