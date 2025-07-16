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

// ZK Authentication API functions
export interface ZkRegisterRequest {
	username: string;
	salt: string;
	commitment: string;
}

export interface ZkLoginRequest {
	username: string;
	proof: string;
	nonce: string;
}

export interface ZkChallengeResponse {
	nonce: string;
	expires_at: string;
}

export interface ZkLoginResponse {
	id: string;
	username: string;
}

export interface ZkUser {
	id?: string;
	username: string;
	salt: string;
	commitment: string;
	nonce?: string;
	nonce_expires?: string;
	created_at: string;
}

const API_BASE = 'http://localhost:8080';

export async function zkRegister(data: ZkRegisterRequest): Promise<ZkUser> {
	return api<ZkUser>(`${API_BASE}/auth/zk/register`, {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

export async function zkGetChallenge(username: string): Promise<ZkChallengeResponse> {
	return api<ZkChallengeResponse>(`${API_BASE}/auth/zk/challenge/${username}`);
}

export async function zkGetSalt(username: string): Promise<string> {
	return api<string>(`${API_BASE}/auth/zk/salt/${username}`);
}

export async function zkLogin(data: ZkLoginRequest): Promise<ZkLoginResponse> {
	return api<ZkLoginResponse>(`${API_BASE}/auth/zk/login`, {
		method: 'POST',
		body: JSON.stringify(data)
	});
}
