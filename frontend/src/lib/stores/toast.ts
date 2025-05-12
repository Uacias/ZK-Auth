import { writable } from 'svelte/store';

export type Toast = {
	id: string;
	type: 'success' | 'error' | 'loading' | 'info';
	message: string;
	duration?: number;
};

function createToastStore() {
	const { subscribe, update } = writable<Toast[]>([]);

	function addToast(toast: Omit<Toast, 'id'>) {
		const id = crypto.randomUUID();
		const fullToast = { ...toast, id };

		update((toasts) => [...toasts, fullToast]);

		// Auto-remove po czasie (domyślnie 4s)
		const duration = toast.duration ?? 4000;
		setTimeout(() => removeToast(id), duration);

		return id;
	}

	function removeToast(id: string) {
		update((toasts) => toasts.filter((t) => t.id !== id));
	}

	return {
		subscribe,
		addToast,
		removeToast
	};
}

export const toastStore = createToastStore();
