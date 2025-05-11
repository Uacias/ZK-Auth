import { showToast } from '$lib/stores/toast';
import { ApiError } from '$lib/utils/api';

export async function wrapWithToast<T>(
	fn: () => Promise<T>,
	messages: { loading: string; success: string; error: string }
): Promise<T | undefined> {
	try {
		showToast({ type: 'loading', message: messages.loading });

		const result = await fn();

		showToast({ type: 'success', message: messages.success });

		return result;
	} catch (err) {
		if (err instanceof ApiError) {
			const detailStr = err.details?.length ? `: ${err.details.join(', ')}` : '';
			showToast({ type: 'error', message: `${err.message}${detailStr}` });
		} else {
			showToast({ type: 'error', message: 'Unexpected error occurred' });
		}
		console.error('❌ Error in toast wrapper:', err);
	}
}
