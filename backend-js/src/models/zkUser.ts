import Joi from 'joi';

export interface ZkUser {
  id?: string;
  username: string;
  salt: string;
  commitment: string;
  nonce?: string;
  nonce_expires?: Date;
  created_at: Date;
}

export interface ZkRegisterPayload {
  username: string;
  salt: string;
  commitment: string;
}

export interface ZkLoginPayload {
  username: string;
  proof: string | number[] | Uint8Array | any;
}

// BigInt versions for pure numeric inputs
export interface ZkRegisterBigIntPayload {
  usernameBigInt: string;
  saltBigInt: string;
  commitmentBigInt: string;
}

export interface ZkLoginBigIntPayload {
  usernameBigInt: string;
  proof: string | number[] | Uint8Array | any;
}

export interface ZkChallengeResponse {
  nonce: string;
  expires_at: Date;
}

export interface ZkLoginResponse {
  id: string;
  username: string;
}

export const zkRegisterSchema = Joi.object({
  username: Joi.string().min(3).required().messages({
    'string.min': 'Username must be at least 3 characters long',
    'any.required': 'Username is required'
  }),
  salt: Joi.string().required().messages({
    'any.required': 'Salt is required'
  }),
  commitment: Joi.string().required().messages({
    'any.required': 'Commitment is required'
  })
});

export const zkLoginSchema = Joi.object({
  username: Joi.string().min(3).required().messages({
    'string.min': 'Username must be at least 3 characters long',
    'any.required': 'Username is required'
  }),
  proof: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.number()),
    Joi.object()
  ).required().messages({
    'any.required': 'Proof is required'
  })
});

export const zkRegisterBigIntSchema = Joi.object({
  usernameBigInt: Joi.string().required().messages({
    'any.required': 'Username BigInt is required'
  }),
  saltBigInt: Joi.string().required().messages({
    'any.required': 'Salt BigInt is required'
  }),
  commitmentBigInt: Joi.string().required().messages({
    'any.required': 'Commitment BigInt is required'
  })
});

export const zkLoginBigIntSchema = Joi.object({
  usernameBigInt: Joi.string().required().messages({
    'any.required': 'Username BigInt is required'
  }),
  proof: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.number()),
    Joi.object()
  ).required().messages({
    'any.required': 'Proof is required'
  })
});

// String versions that will be converted to BigInt
export interface ZkRegisterStringPayload {
  username: string;
  password: string;
  salt: string;
}

export interface ZkLoginStringPayload {
  username: string;
  password: string;
  salt: string;
  proof: string | number[] | Uint8Array | any;
}

export const zkRegisterStringSchema = Joi.object({
  username: Joi.string().max(15).required().messages({
    'string.max': 'Username must be max 15 characters',
    'any.required': 'Username is required'
  }),
  password: Joi.string().max(15).required().messages({
    'string.max': 'Password must be max 15 characters',
    'any.required': 'Password is required'
  }),
  salt: Joi.string().max(15).required().messages({
    'string.max': 'Salt must be max 15 characters',
    'any.required': 'Salt is required'
  })
});

export const zkLoginStringSchema = Joi.object({
  username: Joi.string().max(15).required().messages({
    'string.max': 'Username must be max 15 characters',
    'any.required': 'Username is required'
  }),
  password: Joi.string().max(15).required().messages({
    'string.max': 'Password must be max 15 characters',
    'any.required': 'Password is required'
  }),
  salt: Joi.string().max(15).required().messages({
    'string.max': 'Salt must be max 15 characters',
    'any.required': 'Salt is required'
  }),
  proof: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.number()),
    Joi.object()
  ).required().messages({
    'any.required': 'Proof is required'
  })
});