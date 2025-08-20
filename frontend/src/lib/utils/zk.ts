// ZK proof generation utilities using NoirJS and Barretenberg
import { UltraHonkBackend } from '@aztec/bb.js';
import { Noir } from '@noir-lang/noir_js';
import { init, poseidonHashBN254 } from 'garaga';

// BN254 field modulus
const BN254_FIELD_MODULUS =
	21888242871839275222246405745257275088548364400416034343698204186575808495617n;

// Proper field reduction to ensure values stay within BN254 field
function toField(value: bigint): bigint {
	if (value < 0n) {
		throw new Error(`Field value cannot be negative: ${value}`);
	}
	const result = value % BN254_FIELD_MODULUS;
	if (result >= BN254_FIELD_MODULUS) {
		throw new Error(`Field reduction failed - value still exceeds modulus: ${result}`);
	}
	return result;
}

// Initialize Garaga WASM module
let garagaInitialized = false;

async function initGaraga() {
	if (!garagaInitialized) {
		try {
			await init();
			garagaInitialized = true;
		} catch (error: any) {
			throw new Error(`Failed to initialize Garaga: ${error.message}`);
		}
	}
}

// Poseidon hash using Garaga library - matches Noir circuit
async function poseidonHash(input1: bigint, input2: bigint): Promise<string> {
	try {
		await initGaraga();
		// Use garaga's Poseidon hash which matches the Noir circuit implementation
		const result = poseidonHashBN254(input1, input2);
		return result.toString();
	} catch (error: any) {
		throw new Error(`Failed to compute Poseidon hash: ${error.message}`);
	}
}

export function generateSalt(): string {
	try {
		const bytes = new Uint8Array(8);
		crypto.getRandomValues(bytes);
		// Generate Field-compatible number with proper reduction
		const saltBigInt = bytes.reduce((acc, byte, i) => acc + BigInt(byte) * 256n ** BigInt(i), 0n);
		return toField(saltBigInt).toString();
	} catch (error: any) {
		throw new Error(`Failed to generate salt: ${error.message}`);
	}
}

export function generateUserId(username: string): string {
	try {
		// Convert username to numeric ID using simple hash
		let hash = 0n;
		for (let i = 0; i < username.length; i++) {
			const char = BigInt(username.charCodeAt(i));
			hash = toField(hash * 31n + char);
		}
		return hash.toString();
	} catch (error: any) {
		throw new Error(`Failed to generate user ID: ${error.message}`);
	}
}

// String to Field conversion with BN254 validation
export function stringToField(str: string): bigint {
	try {
		let result = 0n;
		for (let i = 0; i < str.length; i++) {
			result = result * 256n + BigInt(str.charCodeAt(i));
		}
		
		// Check if exceeds BN254 field modulus
		if (result >= BN254_FIELD_MODULUS) {
			throw new Error(`String too long! Maximum supported length: ~30 characters. Your string: "${str}" (${str.length} chars)`);
		}
		
		return result;
	} catch (error: any) {
		throw new Error(`Failed to convert string to field: ${error.message}`);
	}
}

// String-based commitment generation
export async function generateStringCommitment(password: string, salt: string, username: string): Promise<string> {
	try {
		// Convert strings to Field elements with validation
		const passwordField = stringToField(password);
		const saltField = toField(BigInt(salt)); // Salt is still numeric
		const usernameField = stringToField(username);
		
		// Layer 1: Hash password with salt
		const passwordSaltHash = await poseidonHash(passwordField, saltField);
		
		// Layer 2: Hash with username for binding (final commitment)
		const finalHash = await poseidonHash(BigInt(passwordSaltHash), usernameField);
		
		return finalHash;
	} catch (error: any) {
		throw new Error(`Failed to generate string commitment: ${error.message}`);
	}
}

// String-based ZK proof generation
export async function generateStringZkProof(
	password: string,
	salt: string,
	username: string,
	expectedHash: string
): Promise<string> {
	try {
		console.log('🔧 Loading auth circuit for strings...');

		// Load the compiled auth circuit from static files
		const response = await fetch('/zk.json');
		const circuit = await response.json();

		console.log('🔧 Initializing Noir and Barretenberg...');

		// Initialize Noir and Barretenberg
		const noir = new Noir(circuit);
		const backend = new UltraHonkBackend(circuit.bytecode);

		console.log('📊 Preparing string auth circuit inputs...');

		// Convert strings to Field elements (with validation)
		const passwordField = stringToField(password).toString();
		const saltField = toField(BigInt(salt)).toString();
		const usernameField = stringToField(username).toString();
		const expectedHashField = toField(BigInt(expectedHash)).toString();

		const inputs = {
			password: passwordField,
			salt: saltField,
			user_id: usernameField,
			expected_hash: expectedHashField
		};

		console.log('⚡ Executing string auth circuit...', inputs);

		// Execute the circuit to get the witness
		const { witness } = await noir.execute(inputs);

		console.log('🔐 Generating string ZK proof...');

		// Generate the proof
		const proof = await backend.generateProof(witness);

		console.log('✅ String ZK Auth proof generated successfully!');

		// Return the proof as a hex string
		return Array.from(proof.proof, (byte) => byte.toString(16).padStart(2, '0')).join('');
	} catch (error: any) {
		console.error('❌ Failed to generate string ZK auth proof:', error);
		throw new Error(`String ZK auth proof generation failed: ${error?.message || 'Unknown error'}`);
	}
}

export async function generateCommitment(password: string, salt: string, userId: string): Promise<string> {
	try {
		// Convert numeric password to Field
		const passwordField = toField(BigInt(password));
		const saltField = toField(BigInt(salt));
		
		// Layer 1: Hash password with salt
		const passwordSaltHash = await poseidonHash(passwordField, saltField);
		
		// Layer 2: Hash with user_id for binding (final commitment)
		const userIdField = toField(BigInt(userId));
		const finalHash = await poseidonHash(BigInt(passwordSaltHash), userIdField);
		
		return finalHash;
	} catch (error: any) {
		throw new Error(`Failed to generate commitment: ${error.message}`);
	}
}

function hashStringToField(str: string): bigint {
	try {
		let hash = 0n;
		for (let i = 0; i < str.length; i++) {
			const char = BigInt(str.charCodeAt(i));
			hash = toField(hash * 31n + char); // Use proper field reduction
		}
		return hash;
	} catch (error: any) {
		throw new Error(`Failed to hash string to field: ${error.message}`);
	}
}

export async function generateZkProof(
	password: string,
	salt: string,
	userId: string,
	expectedHash: string
): Promise<string> {
	try {
		console.log('🔧 Loading auth circuit...');

		// Load the compiled auth circuit from static files
		const response = await fetch('/zk.json');
		const circuit = await response.json();

		console.log('🔧 Initializing Noir and Barretenberg...');

		// Initialize Noir and Barretenberg
		const noir = new Noir(circuit);
		const backend = new UltraHonkBackend(circuit.bytecode);

		console.log('📊 Preparing auth circuit inputs...');

		// Prepare inputs for the auth circuit (all numeric values as Field elements)
		const passwordField = toField(BigInt(password)).toString();
		const saltField = toField(BigInt(salt)).toString();
		const userIdField = toField(BigInt(userId)).toString();
		const expectedHashField = toField(BigInt(expectedHash)).toString();

		const inputs = {
			password: passwordField,
			salt: saltField,
			user_id: userIdField,
			expected_hash: expectedHashField
		};

		console.log('⚡ Executing auth circuit...', inputs);

		// Execute the circuit to get the witness
		const { witness } = await noir.execute(inputs);

		console.log('🔐 Generating ZK proof...');

		// Generate the proof
		const proof = await backend.generateProof(witness);

		console.log('✅ ZK Auth proof generated successfully!');

		// Return the proof as a hex string
		return Array.from(proof.proof, (byte) => byte.toString(16).padStart(2, '0')).join('');
	} catch (error: any) {
		console.error('❌ Failed to generate ZK auth proof:', error);
		throw new Error(`ZK auth proof generation failed: ${error?.message || 'Unknown error'}`);
	}
}
