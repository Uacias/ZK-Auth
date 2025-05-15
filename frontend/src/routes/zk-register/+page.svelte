<script lang="ts">
	import Input from '$lib/ui/Input.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Card from '$lib/ui/Card.svelte';
	import { wrapWithToast } from '$lib/utils/toast';
	import { api } from '$lib/utils/api';
	import { initZk, poseidonHash2 } from '$lib/utils/zk';
	import { onMount } from 'svelte';

	let name = '';
	let password = '';

	onMount(() => {
		initZk().catch((err) => console.error('❌ Failed to init ZK:', err));
	});

	function stringToField(str: string): bigint {
		const hex = Array.from(new TextEncoder().encode(str))
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');
		return BigInt('0x' + hex);
	}

	function generateSalt(): { bytes: Uint8Array; field: bigint } {
		const salt = crypto.getRandomValues(new Uint8Array(32));
		const hex = Array.from(salt)
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');
		return {
			bytes: salt,
			field: BigInt('0x' + hex)
		};
	}

	async function handleZkRegister() {
		await wrapWithToast(
			async () => {
				const nameField = stringToField(name);
				const passwordField = stringToField(password);
				const { field: saltField } = generateSalt();

				const passwordHash = await poseidonHash2(passwordField, saltField);
				const commitment = await poseidonHash2(nameField, passwordHash);

				await api('http://localhost:8080/auth/zk_register', {
					method: 'POST',
					body: JSON.stringify({
						name,
						salt: saltField.toString(),
						commitment: commitment.toString()
					})
				});

				name = '';
				password = '';
			},
			{
				loading: 'Registering with ZK...',
				success: 'ZK-Register successful!',
				error: 'ZK-Register failed'
			}
		);
	}
</script>

<Card title="zk-Register" class_="mt-3 max-w-md mx-auto">
	<form on:submit|preventDefault={handleZkRegister} class="mt-4 flex flex-col gap-3">
		<Input bind:value={name} placeholder="Name" autocomplete="name" />
		<Input
			bind:value={password}
			placeholder="Password"
			type="password"
			autocomplete="current-password"
		/>
		<Button text="zk-Register" class_="mt-2" />
	</form>
</Card>
