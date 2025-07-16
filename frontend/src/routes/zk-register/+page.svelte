<script lang="ts">
	import { goto } from '$app/navigation';
	import Card from '$lib/ui/Card.svelte';
	import ZkRegisterForm from '$lib/ui/ZkRegisterForm.svelte';

	function handleSuccess(event: CustomEvent) {
		const user = event.detail;
		console.log('ZK Registration successful:', user);
		goto('/zk-login');
	}
</script>

<svelte:head>
	<title>ZK Register - ZK Auth Demo</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
	<Card class="w-full max-w-md">
		<div class="text-center mb-6">
			<h1 class="text-2xl font-bold text-gray-900 dark:text-white">
				Zero-Knowledge Registration
			</h1>
			<p class="text-gray-600 dark:text-gray-400 mt-2">
				Create an account using zero-knowledge proofs
			</p>
		</div>

		<ZkRegisterForm on:success={handleSuccess} />

		<div class="mt-6 text-center">
			<p class="text-sm text-gray-600 dark:text-gray-400">
				Already have an account?
				<a href="/zk-login" class="text-blue-600 dark:text-blue-400 hover:underline">
					Login with ZK
				</a>
			</p>
		</div>

		<div class="mt-6 text-center">
			<p class="text-xs text-gray-500 dark:text-gray-500">
				Other authentication methods:
			</p>
			<div class="flex justify-center space-x-4 mt-2">
				<a href="/simple-register" class="text-xs text-blue-600 dark:text-blue-400 hover:underline">
					Simple Auth
				</a>
				<a href="/hash-register" class="text-xs text-blue-600 dark:text-blue-400 hover:underline">
					Hash Auth
				</a>
			</div>
		</div>
	</Card>
</div>