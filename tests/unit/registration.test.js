import { describe, it, expect, vi } from 'vitest';

import { validateRegistrationInput, registerUser } from '../../src/core/registration.js';
import { verifyPassword } from '../../src/services/password.service.js';
import { ValidationError } from '../../src/errors/validation-error.js';
import { ConflictError } from '../../src/errors/conflict-error.js';

describe('Registration Input Validation', () => {
  it('should accept valid registration data', () => {
    const data = {
      name: 'Mohan',
      email: 'mohan@example.com',
      password: 'MyPassword123!',
    };

    expect(() => validateRegistrationInput(data)).not.toThrow();
  });

  it('should reject missing registration data', () => {
    expect(() => validateRegistrationInput()).toThrow(ValidationError);
  });

  it('should reject an empty name', () => {
    expect(() =>
      validateRegistrationInput({
        name: ' ',
        email: 'mohan@example.com',
        password: 'MyPassword123!',
      })
    ).toThrow(ValidationError);
  });

  it('should reject an invalid email', () => {
    expect(() =>
      validateRegistrationInput({
        name: 'Mohan',
        email: 'invalid-email',
        password: 'MyPassword123!',
      })
    ).toThrow(ValidationError);
  });

  it('should reject an empty password', () => {
    expect(() =>
      validateRegistrationInput({
        name: 'Mohan',
        email: 'mohan@example.com',
        password: '',
      })
    ).toThrow(ValidationError);
  });

  it('should reject an excessively long password', () => {
    expect(() =>
      validateRegistrationInput({
        name: 'Mohan',
        email: 'mohan@example.com',
        password: 'a'.repeat(1025),
      })
    ).toThrow(ValidationError);
  });

  it('should register a user with a hashed password', async () => {
    const userRepository = {
      findByEmail: vi.fn().mockResolvedValue(null),
      createUser: vi.fn(async (data) => ({
        id: 'user-123',
        ...data,
        roles: ['user'],
      })),
      findById: vi.fn(),
    };

    const result = await registerUser(
      {
        name: 'Mohan',
        email: 'Mohan@Example.com',
        password: 'MyPassword123!',
      },
      userRepository
    );

    const savedUser = userRepository.createUser.mock.calls[0][0];

    expect(savedUser.email).toBe('mohan@example.com');
    expect(savedUser.name).toBe('Mohan');
    expect(savedUser.passwordHash).not.toBe('MyPassword123!');

    expect(await verifyPassword('MyPassword123!', savedUser.passwordHash)).toBe(true);

    expect(result).toEqual({
      id: 'user-123',
      name: 'Mohan',
      email: 'mohan@example.com',
      roles: ['user'],
    });

    expect(result.passwordHash).toBeUndefined();
  });

  it('should reject registration when the email already exists', async () => {
    const userRepository = {
      findByEmail: vi.fn().mockResolvedValue({
        id: 'existing-user',
        email: 'mohan@example.com',
      }),
      createUser: vi.fn(),
      findById: vi.fn(),
    };

    await expect(
      registerUser(
        {
          name: 'Mohan',
          email: 'mohan@example.com',
          password: 'MyPassword123!',
        },
        userRepository
      )
    ).rejects.toBeInstanceOf(ConflictError);

    expect(userRepository.createUser).not.toHaveBeenCalled();
  });
  it('should propagate a database duplicate-key conflict', async () => {
    const databaseConflict = new ConflictError('An account with this email already exists');

    const userRepository = {
      findByEmail: vi.fn().mockResolvedValue(null),
      createUser: vi.fn().mockRejectedValue(databaseConflict),
      findById: vi.fn(),
    };

    await expect(
      registerUser(
        {
          name: 'Mohan',
          email: 'mohan@example.com',
          password: 'MyPassword123!',
        },
        userRepository
      )
    ).rejects.toBe(databaseConflict);

    expect(userRepository.createUser).toHaveBeenCalledOnce();
  });
});
