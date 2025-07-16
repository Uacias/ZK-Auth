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

export async function generateCommitment(password: string, salt: string): Promise<string> {
	try {
		// Hash password to Field using Poseidon-style approach
		const passwordField = hashStringToField(password);
		const saltField = toField(BigInt(salt));
		console.log(passwordField, saltField);

		// Compute commitment = Poseidon(password, salt) using Garaga
		const commitment = await poseidonHash(passwordField, saltField);
		return commitment;
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
	nonce: string,
	commitment: string
): Promise<string> {
	try {
		console.log('🔧 Loading circuit...');

		// Load the compiled circuit from static files
		const response = await fetch('/password.json');
		const circuit = await response.json();

		console.log('🔧 Initializing Noir and Barretenberg...');

		// Initialize Noir and Barretenberg
		const noir = new Noir(circuit);
		const backend = new UltraHonkBackend(circuit.bytecode);

		console.log('📊 Preparing inputs...');

		// Prepare inputs for the circuit (all as Field elements with proper reduction)
		const passwordField = hashStringToField(password).toString();
		const saltField = toField(BigInt(salt)).toString(); // Ensure salt is within field bounds
		const nonceField = hashStringToField(nonce).toString(); // Convert nonce string to Field
		const commitmentField = toField(BigInt(commitment)).toString(); // Ensure commitment is within field bounds

		const inputs = {
			password: passwordField,
			salt: saltField,
			nonce: nonceField,
			commitment: commitmentField
		};

		console.log('⚡ Executing circuit...', inputs);

		// Execute the circuit to get the witness
		const { witness } = await noir.execute(inputs);

		console.log('🔐 Generating proof...');

		// Generate the proof
		const proof = await backend.generateProof(witness);

		console.log('✅ Proof generated successfully!');

		// Return the proof as a hex string
		return Array.from(proof.proof, (byte) => byte.toString(16).padStart(2, '0')).join('');
	} catch (error: any) {
		console.error('❌ Failed to generate ZK proof:', error);
		throw new Error(`ZK proof generation failed: ${error?.message || 'Unknown error'}`);
	}
}
