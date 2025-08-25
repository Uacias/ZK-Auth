import { Surreal } from 'surrealdb';
import { UltraHonkBackend } from '@aztec/bb.js';
import { readFileSync } from 'fs';
import { init, poseidonHashBN254 } from 'garaga';
import { 
  ZkUser, 
  ZkLoginResponse,
  ZkRegisterBigIntPayload,
  ZkLoginBigIntPayload,
  ZkRegisterStringPayload,
  ZkLoginStringPayload,
  zkRegisterBigIntSchema,
  zkLoginBigIntSchema,
  zkRegisterStringSchema,
  zkLoginStringSchema
} from '../models/zkUser';
import { ServerError } from '../errors/ServerError';
import { logger } from '../utils/logger';

const CIRCUIT_PATH = '../target/zk.json';

let garagaInitialized = false;

// Initialize Garaga WASM module
async function initGaraga() {
  if (!garagaInitialized) {
    try {
      await init();
      garagaInitialized = true;
      logger.info('✅ Garaga WASM initialized in backend');
    } catch (error: any) {
      logger.error('❌ Failed to initialize Garaga:', error);
      throw new Error(`Failed to initialize Garaga: ${error.message}`);
    }
  }
}

function stringToBigInt(str: string): bigint {
  if (str.length > 15) {
    throw new Error(`String too long! Max 15 characters. Got: ${str.length}`);
  }
  
  let result = 0n;
  for (let i = 0; i < str.length; i++) {
    result = result * 256n + BigInt(str.charCodeAt(i));
  }
  return result;
}


async function verifyProofWithBb(
  proof: string | number[] | Uint8Array | any,
  saltBigInt: string,
  usernameBigInt: string,
  expectedHashBigInt: string
): Promise<boolean> {
  try {
    // Debug: Log the received proof format
    logger.info(`📦 Received proof type: ${typeof proof}, is array: ${Array.isArray(proof)}`);
    if (typeof proof === 'string') {
      logger.info(`📦 Proof string (first 200 chars): ${proof.slice(0, Math.min(200, proof.length))}`);
    } else if (Array.isArray(proof)) {
      logger.info(`📦 Proof array length: ${proof.length}`);
    } else {
      logger.info(`📦 Proof object keys: ${Object.keys(proof || {}).join(', ')}`);
    }

    // Load circuit
    const circuit = JSON.parse(readFileSync(CIRCUIT_PATH, 'utf8'));
    
    // Create backend
    const backend = new UltraHonkBackend(circuit.bytecode);

    // Parse proof - handle different formats from frontend
    let proofData: Uint8Array;
    
    if (typeof proof === 'string') {
      // Remove 0x prefix if present
      const proofHex = proof.startsWith('0x') ? proof.slice(2) : proof;
      proofData = new Uint8Array(Buffer.from(proofHex, 'hex'));
    } else if (Array.isArray(proof)) {
      // Handle number array from frontend
      proofData = new Uint8Array(proof);
    } else if (proof instanceof Uint8Array) {
      // Handle Uint8Array directly
      proofData = proof;
    } else if (proof && typeof proof === 'object') {
      // Handle various object formats
      if ('proof' in proof) {
        const proofBytes = proof.proof;
        if (Array.isArray(proofBytes)) {
          proofData = new Uint8Array(proofBytes);
        } else if (proofBytes instanceof Uint8Array) {
          proofData = proofBytes;
        } else {
          throw new Error('Invalid proof format in object');
        }
      } else {
        // Handle serialized Uint8Array (object with numeric keys)
        const keys = Object.keys(proof);
        if (keys.every(key => !isNaN(Number(key)))) {
          // Convert object with numeric keys back to array
          const array = keys.map(key => proof[key]);
          proofData = new Uint8Array(array);
        } else {
          throw new Error('Proof object missing proof field');
        }
      }
    } else {
      throw new Error('Invalid proof format');
    }

    logger.info(`🔍 Processing proof of length: ${proofData.length} bytes`);

    // Prepare public inputs (same order as in circuit: username, salt, expected_hash) 
    // Convert to hex format for UltraHonk (32 bytes each, big endian)
    const publicInputs = [
      '0x' + BigInt(usernameBigInt).toString(16).padStart(64, '0'),
      '0x' + BigInt(saltBigInt).toString(16).padStart(64, '0'),
      '0x' + BigInt(expectedHashBigInt).toString(16).padStart(64, '0')
    ];

    logger.info(`🔍 Public inputs: username=${usernameBigInt}, salt=${saltBigInt}, expectedHash=${expectedHashBigInt}`);

    // Verify proof with UltraHonk
    const isValid = await backend.verifyProof({
      proof: proofData,
      publicInputs: publicInputs
    });

    if (isValid) {
      logger.info('✅ BB verification successful');
      return true;
    } else {
      logger.warn('❌ BB verification failed');
      return false;
    }
  } catch (error) {
    logger.error('❌ Proof verification error:', error);
    throw new Error(`Failed to verify proof with BB.js: ${error}`);
  }
}

// Removed unused functions: registerZkUser, getUserSalt, getChallenge

// BigInt version of register
export async function registerZkUserBigInt(db: Surreal, payload: ZkRegisterBigIntPayload): Promise<ZkUser> {
  // Validate payload
  const { error } = zkRegisterBigIntSchema.validate(payload);
  if (error) {
    const details = error.details.map(detail => detail.message);
    logger.warn('❌ ZK Register BigInt validation error:', details);
    throw ServerError.badRequest('Invalid input', details);
  }

  try {
    // Check if username BigInt already exists
    const sql = 'SELECT * FROM zk_user WHERE username = $username';
    const response = await db.query(sql, { username: payload.usernameBigInt });

    if (response && Array.isArray(response) && response.length > 0) {
      const existingUsers = response[0];
      if (existingUsers && Array.isArray(existingUsers) && existingUsers.length > 0) {
        throw ServerError.badRequest('Username already exists', ['Choose a different username']);
      }
    }

    const now = new Date();
    const created = await db.create('zk_user', {
      username: payload.usernameBigInt,
      salt: payload.saltBigInt,
      commitment: payload.commitmentBigInt,
      nonce: null,
      nonce_expires: null,
      created_at: now,
    });

    if (!created || (Array.isArray(created) && created.length === 0)) {
      throw ServerError.noRecordCreated();
    }

    const user = Array.isArray(created) ? created[0] : created;
    return user as unknown as ZkUser;
  } catch (error) {
    if (error instanceof ServerError) {
      throw error;
    }
    logger.error('❌ Failed to create ZK user BigInt:', error);
    throw ServerError.db(String(error));
  }
}

// BigInt version of login
export async function verifyZkProofBigInt(db: Surreal, payload: ZkLoginBigIntPayload): Promise<ZkLoginResponse> {
  // Validate payload
  const { error } = zkLoginBigIntSchema.validate(payload);
  if (error) {
    const details = error.details.map(detail => detail.message);
    logger.warn('❌ ZK Login BigInt validation error:', details);
    throw ServerError.badRequest('Invalid input', details);
  }

  try {
    // Get user
    const sql = 'SELECT * FROM zk_user WHERE username = $username';
    const response = await db.query(sql, { username: payload.usernameBigInt });

    if (!response || !Array.isArray(response) || response.length === 0) {
      throw ServerError.invalidCredentials();
    }

    const users = response[0];
    if (!users || !Array.isArray(users) || users.length === 0) {
      throw ServerError.invalidCredentials();
    }

    const user = users[0] as unknown as ZkUser;

    // Verify the ZK proof using Barretenberg
    try {
      const isValid = await verifyProofWithBb(
        payload.proof,
        user.salt,     // salt as BigInt string
        user.username, // username as BigInt string  
        user.commitment // commitment as BigInt string
      );

      if (!isValid) {
        logger.warn(`❌ ZK proof verification failed for user BigInt: ${payload.usernameBigInt}`);
        throw ServerError.invalidCredentials();
      }

      logger.info(`✅ ZK proof verification successful for user BigInt: ${payload.usernameBigInt}`);
    } catch (error) {
      logger.error(`❌ ZK proof verification error for user BigInt: ${payload.usernameBigInt}:`, error);
      throw ServerError.internalServerError(`Proof verification failed: ${error}`);
    }

    logger.info(`✅ ZK proof verified for user BigInt: ${payload.usernameBigInt}`);

    return {
      id: user.id || '',
      username: user.username,
    };
  } catch (error) {
    if (error instanceof ServerError) {
      throw error;
    }
    logger.error('❌ DB query error:', error);
    throw ServerError.db(String(error));
  }
}

// Removed unused function: verifyZkProof

// String versions - convert to BigInt internally
export async function registerZkUserString(db: Surreal, payload: ZkRegisterStringPayload): Promise<ZkUser> {
  // Validate payload
  const { error } = zkRegisterStringSchema.validate(payload);
  if (error) {
    const details = error.details.map(detail => detail.message);
    logger.warn("❌ ZK Register String validation error:", details);
    throw ServerError.badRequest("Invalid input", details);
  }

  try {
    // Initialize Garaga
    await initGaraga();

    // Convert strings to BigInt
    const usernameBigInt = stringToBigInt(payload.username);
    const saltBigInt = stringToBigInt(payload.salt);
    const passwordBigInt = stringToBigInt(payload.password);

    // Calculate commitment using Garaga Poseidon: Poseidon(Poseidon(password, salt), username)
    const passwordSaltHash = poseidonHashBN254(passwordBigInt, saltBigInt);
    const commitment = poseidonHashBN254(passwordSaltHash, usernameBigInt);
    
    logger.info(`🔢 String to BigInt conversion:
      Username: ${payload.username} → ${usernameBigInt.toString()}
      Salt: ${payload.salt} → ${saltBigInt.toString()}
      Password: ${payload.password} → ${passwordBigInt.toString()}
      Commitment: ${commitment.toString()}`);

    // Check if username BigInt already exists
    const sql = "SELECT * FROM zk_user WHERE username = \$username";
    const response = await db.query(sql, { username: usernameBigInt.toString() });

    if (response && Array.isArray(response) && response.length > 0) {
      const existingUsers = response[0];
      if (existingUsers && Array.isArray(existingUsers) && existingUsers.length > 0) {
        throw ServerError.badRequest("Username already exists", ["Choose a different username"]);
      }
    }

    const now = new Date();
    const created = await db.create("zk_user", {
      username: usernameBigInt.toString(),
      salt: saltBigInt.toString(),
      commitment: commitment.toString(),
      nonce: null,
      nonce_expires: null,
      created_at: now,
    });

    if (!created || (Array.isArray(created) && created.length === 0)) {
      throw ServerError.noRecordCreated();
    }

    const user = Array.isArray(created) ? created[0] : created;
    return user as unknown as ZkUser;
  } catch (error) {
    if (error instanceof ServerError) {
      throw error;
    }
    logger.error("❌ Failed to create ZK user String:", error);
    throw ServerError.db(String(error));
  }
}

export async function verifyZkProofString(db: Surreal, payload: ZkLoginStringPayload): Promise<ZkLoginResponse> {
  // Validate payload
  const { error } = zkLoginStringSchema.validate(payload);
  if (error) {
    const details = error.details.map(detail => detail.message);
    logger.warn("❌ ZK Login String validation error:", details);
    throw ServerError.badRequest("Invalid input", details);
  }

  try {
    // Convert strings to BigInt
    const usernameBigInt = stringToBigInt(payload.username);

    // Get user
    const sql = "SELECT * FROM zk_user WHERE username = \$username";
    const response = await db.query(sql, { username: usernameBigInt.toString() });

    if (!response || !Array.isArray(response) || response.length === 0) {
      throw ServerError.invalidCredentials();
    }

    const users = response[0];
    if (!users || !Array.isArray(users) || users.length === 0) {
      throw ServerError.invalidCredentials();
    }

    const user = users[0] as unknown as ZkUser;

    // Verify the ZK proof using Barretenberg
    try {
      const isValid = await verifyProofWithBb(
        payload.proof,
        user.salt,     // salt as BigInt string
        user.username, // username as BigInt string  
        user.commitment // commitment as BigInt string
      );

      if (!isValid) {
        logger.warn(`❌ ZK proof verification failed for user String: ${payload.username}`);
        throw ServerError.invalidCredentials();
      }

      logger.info(`✅ ZK proof verification successful for user String: ${payload.username}`);
    } catch (error) {
      logger.error(`❌ ZK proof verification error for user String: ${payload.username}:`, error);
      throw ServerError.internalServerError(`Proof verification failed: ${error}`);
    }

    logger.info(`✅ ZK proof verified for user String: ${payload.username}`);

    return {
      id: user.id || "",
      username: user.username,
    };
  } catch (error) {
    if (error instanceof ServerError) {
      throw error;
    }
    logger.error("❌ DB query error String:", error);
    throw ServerError.db(String(error));
  }
}

