<script lang="ts">
	import ToggleTheme from './ToggleTheme.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	
	$: currentPath = $page.url.pathname;
</script>

<nav
	class="fixed top-0 right-0 left-0 flex w-full items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 shadow-sm z-50"
>
	<a href="/" class="text-primary text-xl font-bold hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
		ZK-Auth
	</a>

	<div class="flex items-center gap-6">
		<!-- Auth Methods Dropdown -->
		<div class="relative group">
			<button class="flex items-center gap-1 text-secondary hover:text-primary transition-colors">
				Auth Methods
				<svg class="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7"></path>
				</svg>
			</button>
			
			<div class="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-200 dark:border-gray-700">
				<div class="py-2">
					<!-- Simple Auth -->
					<div class="px-4 py-1 text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">Simple Auth</div>
					<a href="/simple-register" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-900/20 {currentPath === '/simple-register' ? 'bg-red-50 dark:bg-red-900/20' : ''}">
						Register
					</a>
					<a href="/simple-login" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-900/20 {currentPath === '/simple-login' ? 'bg-red-50 dark:bg-red-900/20' : ''}">
						Login
					</a>
					
					<!-- Hash Auth -->
					<div class="px-4 py-1 mt-2 text-xs font-semibold text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">Hash Auth</div>
					<a href="/hash-register" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 {currentPath === '/hash-register' ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}">
						Register
					</a>
					<a href="/hash-login" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 {currentPath === '/hash-login' ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}">
						Login
					</a>
					
					<!-- ZK Auth -->
					<div class="px-4 py-1 mt-2 text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">ZK Auth</div>
					<a href="/string-zk-auth" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-green-900/20 {currentPath === '/string-zk-auth' ? 'bg-green-50 dark:bg-green-900/20' : ''}">
						Zero-Knowledge Auth
					</a>
				</div>
			</div>
		</div>

		<ToggleTheme />
	</div>
</nav>
