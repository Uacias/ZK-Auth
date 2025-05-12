import { toastStore } from '$lib/stores/toast';
import { ApiError } from '$lib/utils/api';

export async function wrapWithToast<T>(
	fn: () => Promise<T>,
	messages: { loading: string; success: string; error: string }
): Promise<T | undefined> {
	const loadingId = toastStore.addToast({
		type: 'loading',
		message: messages.loading
	});

	try {
		const result = await fn();

		toastStore.removeToast(loadingId);
		toastStore.addToast({
			type: 'success',
			message: messages.success
		});

		return result;
	} catch (err) {
		toastStore.removeToast(loadingId);

		if (err instanceof ApiError) {
			const detailStr = err.details?.length ? `: ${err.details.join(', ')}` : '';
			toastStore.addToast({
				type: 'error',
				message: `${err.message}${detailStr}`
			});
		} else {
			toastStore.addToast({
				type: 'error',
				message: 'Unexpected error occurred'
			});
		}
		console.error('❌ Error in toast wrapper:', err);
	}
}
