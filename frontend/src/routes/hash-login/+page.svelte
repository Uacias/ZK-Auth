<script lang="ts">
	import LoginForm from '$lib/ui/LoginForm.svelte';
</script>

<div class="content">
	<h2 class="text-primary mb-4 text-2xl font-bold">Hashed Login</h2>
	<LoginForm endpoint="login_hashed" />
</div>
