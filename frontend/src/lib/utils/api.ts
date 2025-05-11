export class ApiError extends Error {
	code?: number;
	details?: string[];

	constructor(message: string, code?: number, details?: string[]) {
		super(message);
		this.name = 'ApiError';
		this.code = code;
		this.details = details;
	}
}

export async function api<T>(endpoint: string, options?: RequestInit): Promise<T> {
	const res = await fetch(endpoint, {
		headers: {
			'Content-Type': 'application/json',
			...(options?.headers ?? {})
		},
		...options
	});

	const data = await res.json();

	if (!res.ok) {
		const message =
			typeof data.error === 'string' ? data.error : data.error.message || 'Unknown error';
		const details = typeof data.error === 'string' ? undefined : data.error.details;
		throw new ApiError(message, res.status, details);
	}

	return data;
}
