import { describe, it, expect } from 'vitest';
import { createAuth } from '../../src/core/auth.js';

const validConfig = {
  userRepository: {
    createUser: async () => ({}),
    findByEmail: async () => null,
    findById: async () => null,
  },
  jwtSecret: 'test-only-secret-with-at-least-32-characters',
};

describe('Auth Factory', () => {
  it('should create an AuthBridge instance with valid configuration', () => {
    const auth = createAuth(validConfig);

    expect(auth).toBeDefined();
    expect(auth.register).toBeTypeOf('function');
    expect(auth.login).toBeTypeOf('function');
    expect(auth.authenticate).toBeTypeOf('function');
    expect(auth.authorize).toBeTypeOf('function');
  });
  it('should reject invalid configuration during initialization', () => {
    expect(() => createAuth()).toThrow('AuthBridge configuration is required');
  });

  it('should register a user through the public AuthBridge API', async () => {
    const userRepository = {
      createUser: async (data) => ({
        id: 'user-123',
        ...data,
        roles: ['user'],
      }),
      findByEmail: async () => null,
      findById: async () => null,
    };

    const auth = createAuth({
      ...validConfig,
      userRepository,
    });

    const result = await auth.register({
      name: 'Mohan',
      email: 'mohan@example.com',
      password: 'MyPassword123!',
    });

    expect(result.id).toBe('user-123');
    expect(result.email).toBe('mohan@example.com');
    expect(result.roles).toEqual(['user']);
    expect(result.passwordHash).toBeUndefined();
  });
});
