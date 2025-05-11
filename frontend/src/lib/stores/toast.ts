import { writable } from 'svelte/store';

export type Toast = {
	type: 'success' | 'error' | 'loading';
	message: string;
};

export const toast = writable<Toast | null>(null);

export function showToast(toastData: Toast, duration = 4000) {
	toast.set(toastData);
	setTimeout(() => toast.set(null), duration);
}
