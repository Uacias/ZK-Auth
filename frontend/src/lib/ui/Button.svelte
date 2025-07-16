<script lang="ts">
	import type { Snippet } from 'svelte';
	
	interface Props {
		type?: 'button' | 'submit' | 'reset';
		variant?: 'primary' | 'secondary';
		loading?: boolean;
		disabled?: boolean;
		class_?: string;
		children?: Snippet;
	}
	
	let { type = 'button', variant = 'primary', loading = false, disabled = false, class_ = '', children, ...restProps }: Props = $props();
	
	let buttonClasses = $derived(() => {
		let classes = 'rounded px-4 py-2 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2';
		
		if (variant === 'primary') {
			classes += ' bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500';
		} else {
			classes += ' bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500';
		}
		
		if (loading || disabled) {
			classes += ' opacity-50 cursor-not-allowed';
		}
		
		return `${classes} ${class_}`;
	});
</script>

<button 
	{type} 
	class={buttonClasses} 
	disabled={loading || disabled}
	{...restProps}
>
	{@render children?.()}
</button>
