import argon2 from 'argon2';

const MAX_STRING_CHARS = 30;

export async function hashPassword(password: string): Promise<string> {
  try {
    return await argon2.hash(password);
  } catch (error) {
    throw new Error(`Hashing error: ${error}`);
  }
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  try {
    return await argon2.verify(hashed, password);
  } catch (error) {
    throw new Error(`Failed to verify password: ${error}`);
  }
}

export function stringToField(s: string): number {
  if (s.length > MAX_STRING_CHARS) {
    throw new Error(
      `String too long! Maximum supported length: ${MAX_STRING_CHARS} characters. Your string: '${s}' (${s.length} chars)`
    );
  }
  
  let result = 0;
  for (let i = 0; i < s.length; i++) {
    const byteValue = s.charCodeAt(i);
    const newResult = result * 256 + byteValue;
    
    // Check for overflow (simple check for JavaScript number limits)
    if (newResult > Number.MAX_SAFE_INTEGER) {
      throw new Error('String too long for BN254 field');
    }
    
    result = newResult;
  }
  
  return result;
}