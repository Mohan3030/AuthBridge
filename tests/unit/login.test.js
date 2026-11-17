import { describe, it, expect, vi } from 'vitest';

import { validateLoginInput, loginUser } from '../../src/core/login.js';
import { hashPassword } from '../../src/services/password.service.js';
import { verifyToken } from '../../src/services/token.service.js';
import { ValidationError } from '../../src/errors/validation-error.js';
import { AuthenticationError } from '../../src/errors/authentication-error.js';

describe('Login Input Validation', () => {
  it('should accept valid login credentials', () => {
    const credentials = {
      email: 'mohan@example.com',
      password: 'MyPassword123!',
    };

    expect(() => validateLoginInput(credentials)).not.toThrow();
  });

  it('should reject missing credentials', () => {
    expect(() => validateLoginInput()).toThrow(ValidationError);
  });

  it('should reject an invalid email', () => {
    expect(() =>
      validateLoginInput({
        email: 'invalid-email',
        password: 'MyPassword123!',
      })
    ).toThrow(ValidationError);
  });

  it('should reject an empty password', () => {
    expect(() =>
      validateLoginInput({
        email: 'mohan@example.com',
        password: '',
      })
    ).toThrow(ValidationError);
  });

  it('should reject an excessively long password', () => {
    expect(() =>
      validateLoginInput({
        email: 'mohan@example.com',
        password: 'a'.repeat(1025),
      })
    ).toThrow(ValidationError);
  });

  it('should reject an array as login credentials', () => {
    expect(() => validateLoginInput([])).toThrow(ValidationError);
  });

  it('should login successfully with valid credentials', async () => {
    const passwordHash = await hashPassword('MyPassword123!');

    const user = {
      id: 'user-123',
      name: 'Mohan',
      email: 'mohan@example.com',
      passwordHash,
      roles: ['user'],
    };

    const userRepository = {
      findByEmail: vi.fn().mockResolvedValue(user),
    };

    const config = {
      jwtSecret: 'test-only-secret-with-at-least-32-characters',
      tokenExpiry: '15m',
    };

    const result = await loginUser(
      {
        email: 'Mohan@Example.com',
        password: 'MyPassword123!',
      },
      userRepository,
      config
    );

    expect(result.user.id).toBe('user-123');
    expect(result.user.email).toBe('mohan@example.com');
    expect(result.user.passwordHash).toBeUndefined();
    expect(result.accessToken).toBeTypeOf('string');

    const payload = await verifyToken(result.accessToken, config);

    expect(payload.sub).toBe('user-123');
    expect(payload.roles).toEqual(['user']);
  });

  it('should reject an incorrect password', async () => {
    const passwordHash = await hashPassword('MyPassword123!');

    const userRepository = {
      findByEmail: vi.fn().mockResolvedValue({
        id: 'user-123',
        passwordHash,
        roles: ['user'],
      }),
    };

    const config = {
      jwtSecret: 'test-only-secret-with-at-least-32-characters',
    };

    await expect(
      loginUser(
        {
          email: 'mohan@example.com',
          password: 'WrongPassword123!',
        },
        userRepository,
        config
      )
    ).rejects.toBeInstanceOf(AuthenticationError);
  });
  it('should propagate an error when the stored password hash is malformed', async () => {
    const userRepository = {
      findByEmail: vi.fn().mockResolvedValue({
        id: 'user-123',
        passwordHash: 'not-a-valid-argon2-hash',
        roles: ['user'],
      }),
    };

    const config = {
      jwtSecret: 'test-only-secret-with-at-least-32-characters',
    };

    await expect(
      loginUser(
        {
          email: 'mohan@example.com',
          password: 'MyPassword123!',
        },
        userRepository,
        config
      )
    ).rejects.toThrow();
  });
  it('should reject an unknown email', async () => {
    const userRepository = {
      findByEmail: vi.fn().mockResolvedValue(null),
    };

    const config = {
      jwtSecret: 'test-only-secret-with-at-least-32-characters',
    };

    await expect(
      loginUser(
        {
          email: 'unknown@example.com',
          password: 'MyPassword123!',
        },
        userRepository,
        config
      )
    ).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('should return the same error message for unknown email and incorrect password', async () => {
    const passwordHash = await hashPassword('MyPassword123!');

    const existingUserRepository = {
      findByEmail: vi.fn().mockResolvedValue({
        id: 'user-123',
        passwordHash,
        roles: ['user'],
      }),
    };

    const unknownUserRepository = {
      findByEmail: vi.fn().mockResolvedValue(null),
    };

    const config = {
      jwtSecret: 'test-only-secret-with-at-least-32-characters',
    };

    const incorrectPasswordError = await loginUser(
      {
        email: 'mohan@example.com',
        password: 'WrongPassword123!',
      },
      existingUserRepository,
      config
    ).catch((error) => error);

    const unknownEmailError = await loginUser(
      {
        email: 'unknown@example.com',
        password: 'MyPassword123!',
      },
      unknownUserRepository,
      config
    ).catch((error) => error);

    expect(incorrectPasswordError).toBeInstanceOf(AuthenticationError);
    expect(unknownEmailError).toBeInstanceOf(AuthenticationError);

    expect(incorrectPasswordError.message).toBe('Invalid email or password');
    expect(unknownEmailError.message).toBe('Invalid email or password');
  });
});
