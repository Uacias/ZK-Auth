<script lang="ts"></script>

<div class="content">
	<h1 class="text-primary text-4xl font-bold">Hello ZK-Auth!</h1>
	<p class="text-secondary mt-2 text-lg">Private authentication with Zero-Knowledge Proof</p>
	<p class="text-secondary text-md mt-4">Choose between three authentication methods:</p>
	
	<div class="grid gap-4 mt-6 md:grid-cols-3">
		<!-- Simple Auth -->
		<div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
			<h3 class="font-semibold text-red-600 dark:text-red-400">Simple Auth</h3>
			<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
				Plain text passwords (testing only)
			</p>
			<div class="mt-3 space-x-2">
				<a href="/simple-register" class="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200">
					Register
				</a>
				<a href="/simple-login" class="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200">
					Login
				</a>
			</div>
		</div>

		<!-- Hash Auth -->
		<div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
			<h3 class="font-semibold text-yellow-600 dark:text-yellow-400">Hash Auth</h3>
			<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
				Traditional password hashing (Argon2)
			</p>
			<div class="mt-3 space-x-2">
				<a href="/hash-register" class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-200">
					Register
				</a>
				<a href="/hash-login" class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-200">
					Login
				</a>
			</div>
		</div>

		<!-- ZK Auth -->
		<div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
			<h3 class="font-semibold text-green-600 dark:text-green-400">ZK Auth</h3>
			<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
				Zero-knowledge proof authentication
			</p>
			<div class="mt-3 space-x-2">
				<a href="/string-zk-register" class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200">
					Register
				</a>
				<a href="/string-zk-login" class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200">
					Login
				</a>
			</div>
		</div>
	</div>

	<div class="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
		<h3 class="font-semibold text-blue-900 dark:text-blue-100">About Zero-Knowledge Authentication</h3>
		<p class="text-sm text-blue-800 dark:text-blue-200 mt-2">
			ZK Auth allows you to prove you know your password without ever sending it to the server.
			The server only sees cryptographic proofs, ensuring maximum privacy and security.
		</p>
	</div>
</div>
