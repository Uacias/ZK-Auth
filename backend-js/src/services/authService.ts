import { Surreal } from 'surrealdb';
import { User, RegisterPayload, LoginPayload, LoginResponse, registerSchema, loginSchema } from '../models/user';
import { ServerError } from '../errors/ServerError';
import { logger } from '../utils/logger';

export async function registerUser(db: Surreal, payload: RegisterPayload): Promise<User> {
  // Validate payload
  const { error } = registerSchema.validate(payload);
  if (error) {
    const details = error.details.map(detail => detail.message);
    logger.warn('❌ Register validation error:', details);
    throw ServerError.badRequest('Invalid input', details);
  }

  try {
    const created = await db.create('user', {
      name: payload.name,
      password: payload.password,
    });

    if (!created || (Array.isArray(created) && created.length === 0)) {
      throw ServerError.noRecordCreated();
    }

    const user = Array.isArray(created) ? created[0] : created;
    return user as unknown as User;
  } catch (error) {
    if (error instanceof ServerError) {
      throw error;
    }
    logger.error('❌ Failed to create user:', error);
    throw ServerError.db(String(error));
  }
}

export async function loginUser(db: Surreal, payload: LoginPayload): Promise<LoginResponse> {
  // Validate payload
  const { error } = loginSchema.validate(payload);
  if (error) {
    const details = error.details.map(detail => detail.message);
    logger.warn('❌ Login validation error:', details);
    throw ServerError.badRequest('Invalid input', details);
  }

  try {
    const sql = 'SELECT * FROM user WHERE name = $name';
    const response = await db.query(sql, { name: payload.name });

    if (!response || !Array.isArray(response) || response.length === 0) {
      throw ServerError.invalidCredentials();
    }

    const users = response[0];
    if (!users || !Array.isArray(users) || users.length === 0) {
      throw ServerError.invalidCredentials();
    }

    const user = users[0] as User;

    if (user.password !== payload.password) {
      throw ServerError.invalidCredentials();
    }

    return {
      id: user.id,
      name: user.name,
    };
  } catch (error) {
    if (error instanceof ServerError) {
      throw error;
    }
    logger.error('❌ DB query error:', error);
    throw ServerError.db(String(error));
  }
}