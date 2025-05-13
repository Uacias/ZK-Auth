<script lang="ts">
	import RegisterForm from '$lib/ui/RegisterForm.svelte';
</script>

<div class="content">
	<h2 class="text-primary mb-4 text-2xl font-bold">Hashed Register</h2>
	<RegisterForm endpoint="register_hashed" />
</div>
