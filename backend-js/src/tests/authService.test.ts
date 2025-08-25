import { Surreal } from 'surrealdb';
const { surrealdbNodeEngines } = require('@surrealdb/node');
import { registerUser, loginUser } from '../services/authService';
import { RegisterPayload, LoginPayload } from '../models/user';
import { ServerError } from '../errors/ServerError';

describe('AuthService', () => {
  let db: Surreal;

  beforeAll(async () => {
    db = new Surreal({
      engines: surrealdbNodeEngines(),
    });
    await db.connect('mem://');
    await db.use({ namespace: 'test', database: 'test' });
  });

  afterAll(async () => {
    await db.close();
  });

  beforeEach(async () => {
    // Clear test data
    await db.query('DELETE FROM user');
  });

  describe('registerUser', () => {
    it('should register a user successfully', async () => {
      const payload: RegisterPayload = {
        name: 'testuser',
        password: 'password123'
      };

      const user = await registerUser(db, payload);
      
      expect(user.name).toBe('testuser');
      expect(user.password).toBe('password123');
      expect(user.id).toBeDefined();
    });

    it('should validate name length', async () => {
      const payload: RegisterPayload = {
        name: 'ab', // too short
        password: 'password123'
      };

      await expect(registerUser(db, payload)).rejects.toThrow(ServerError);
    });

    it('should validate password length', async () => {
      const payload: RegisterPayload = {
        name: 'testuser',
        password: '12345' // too short
      };

      await expect(registerUser(db, payload)).rejects.toThrow(ServerError);
    });
  });

  describe('loginUser', () => {
    beforeEach(async () => {
      // Create test user
      const payload: RegisterPayload = {
        name: 'testuser',
        password: 'password123'
      };
      await registerUser(db, payload);
    });

    it('should login successfully with correct credentials', async () => {
      const payload: LoginPayload = {
        name: 'testuser',
        password: 'password123'
      };

      const result = await loginUser(db, payload);
      
      expect(result.name).toBe('testuser');
      expect(result.id).toBeDefined();
    });

    it('should fail with incorrect password', async () => {
      const payload: LoginPayload = {
        name: 'testuser',
        password: 'wrongpassword'
      };

      await expect(loginUser(db, payload)).rejects.toThrow(ServerError);
    });

    it('should fail with non-existent user', async () => {
      const payload: LoginPayload = {
        name: 'nonexistent',
        password: 'password123'
      };

      await expect(loginUser(db, payload)).rejects.toThrow(ServerError);
    });
  });
});