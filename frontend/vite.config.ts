import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	optimizeDeps: {
		esbuildOptions: { target: "esnext" },
		exclude: ['@noir-lang/noirc_abi', '@noir-lang/acvm_js']
	}
});
