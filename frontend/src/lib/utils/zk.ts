// ZK proof generation utilities using NoirJS and Barretenberg
import { UltraHonkBackend } from '@aztec/bb.js';
import { Noir } from '@noir-lang/noir_js';

export function generateSalt(): string {
	const bytes = new Uint8Array(4); // 4 bytes
	crypto.getRandomValues(bytes);
	// Generate smaller number to fit in u64 range
	const saltNum = (bytes[0] << 16) | (bytes[1] << 8) | bytes[2]; // 24-bit number
	return saltNum.toString();
}

export function generateCommitment(password: string, salt: string): string {
	// Simple implementation for demo: password + salt as u64
	const passwordNum = hashStringToU64(password);
	const saltNum = parseInt(salt);
	const commitment = passwordNum + saltNum;
	return commitment.toString();
}

function hashStringToU64(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		// Keep it within safe integer range for JavaScript
		hash = Math.abs(hash) % Number.MAX_SAFE_INTEGER;
	}
	return hash;
}

export async function generateZkProof(
	password: string,
	salt: string,
	_nonce: string,
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

		// Prepare inputs for the circuit
		const passwordNum = hashStringToU64(password);
		const saltNum = parseInt(salt);
		const commitmentNum = parseInt(commitment);

		const inputs = {
			password: passwordNum,
			salt: saltNum,
			commitment: commitmentNum
		};

		console.log('⚡ Executing circuit...', inputs);

		// Execute the circuit to get the witness
		const { witness } = await noir.execute(inputs);

		console.log('🔐 Generating proof...');

		// Generate the proof
		const proof = await backend.generateProof(witness);

		console.log('✅ Proof generated successfully!');

		// Return the proof as a base64 string
		return Array.from(proof.proof, (byte) => byte.toString(16).padStart(2, '0')).join('');
	} catch (error: any) {
		console.error('❌ Failed to generate ZK proof:', error);
		throw new Error(`ZK proof generation failed: ${error?.message || 'Unknown error'}`);
	}
}
