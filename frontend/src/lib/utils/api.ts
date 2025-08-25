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

// Base interfaces
export interface User {
	id?: string;
	username: string;
	password?: string;
	created_at?: string;
}

export interface RegisterPayload {
	username: string;
	password: string;
}

export interface LoginPayload {
	username: string;
	password: string;
}

export interface LoginResponse {
	id: string;
	username: string;
}

const API_BASE = 'http://localhost:8080';

// Simple Auth API
export async function register(data: RegisterPayload): Promise<User> {
	return api<User>(`${API_BASE}/auth/register`, {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

export async function login(data: LoginPayload): Promise<LoginResponse> {
	return api<LoginResponse>(`${API_BASE}/auth/login`, {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

// Hash Auth API
export async function registerHashed(data: RegisterPayload): Promise<User> {
	return api<User>(`${API_BASE}/auth/register_hashed`, {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

export async function loginHashed(data: LoginPayload): Promise<LoginResponse> {
	return api<LoginResponse>(`${API_BASE}/auth/login_hashed`, {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

// ZK Auth API - BigInt version
export interface ZkRegisterBigIntRequest {
	usernameBigInt: string;
	saltBigInt: string;
	commitmentBigInt: string;
}

export interface ZkLoginBigIntRequest {
	usernameBigInt: string;
	proof: any;
}

export interface ZkRegisterResponse {
	id: string;
	username: string;
	salt: string;
	commitment: string;
	created_at: string;
}

export interface ZkLoginResponse {
	id: string;
	username: string;
}

export async function zkRegisterBigInt(data: ZkRegisterBigIntRequest): Promise<ZkRegisterResponse> {
	return api<ZkRegisterResponse>(`${API_BASE}/auth/zk/register_bigint`, {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

export async function zkLoginBigInt(data: ZkLoginBigIntRequest): Promise<ZkLoginResponse> {
	return api<ZkLoginResponse>(`${API_BASE}/auth/zk/login_bigint`, {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

// ZK Auth API - String version
export interface ZkRegisterStringRequest {
	username: string;
	password: string;
	salt: string;
}

export interface ZkLoginStringRequest {
	username: string;
	password: string;
	salt: string;
	proof: any;
}

export async function zkRegisterString(data: ZkRegisterStringRequest): Promise<ZkRegisterResponse> {
	return api<ZkRegisterResponse>(`${API_BASE}/auth/zk/register_string`, {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

export async function zkLoginString(data: ZkLoginStringRequest): Promise<ZkLoginResponse> {
	return api<ZkLoginResponse>(`${API_BASE}/auth/zk/login_string`, {
		method: 'POST',
		body: JSON.stringify(data)
	});
}