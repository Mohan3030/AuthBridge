import { describe, it, expect } from 'vitest';

import { AuthBridgeError } from '../../src/errors/authbridge-error.js';
import { ValidationError } from '../../src/errors/validation-error.js';
import { AuthenticationError } from '../../src/errors/authentication-error.js';
import { AuthorizationError } from '../../src/errors/authorization-error.js';
import { ConflictError } from '../../src/errors/conflict-error.js';

describe('AuthBridge Error Hierarchy', () => {
  it('should create a base AuthBridgeError', () => {
    const error = new AuthBridgeError('Something went wrong');

    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe('AUTHBRIDGE_ERROR');
    expect(error.statusCode).toBe(500);
  });

  it('should create a ValidationError', () => {
    const error = new ValidationError('Invalid email');

    expect(error).toBeInstanceOf(AuthBridgeError);
    expect(error.name).toBe('ValidationError');
    expect(error.message).toBe('Invalid email');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('should create an AuthenticationError', () => {
    const error = new AuthenticationError();

    expect(error.name).toBe('AuthenticationError');
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('AUTHENTICATION_ERROR');
  });

  it('should create an AuthorizationError', () => {
    const error = new AuthorizationError();

    expect(error.name).toBe('AuthorizationError');
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('AUTHORIZATION_ERROR');
  });

  it('should create a ConflictError', () => {
    const error = new ConflictError();

    expect(error.name).toBe('ConflictError');
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe('CONFLICT_ERROR');
  });
});
