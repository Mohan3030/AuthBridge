import { describe, it, expect } from 'vitest';

import {
  createAuth,
  AuthBridgeError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
} from '../../src/index.js';

describe('AuthBridge Public API', () => {
  it('should export createAuth as a function', () => {
    expect(createAuth).toBeTypeOf('function');
  });

  it('should export the base error class', () => {
    expect(AuthBridgeError).toBeTypeOf('function');
  });

  it('should export all specialized error classes', () => {
    expect(ValidationError).toBeTypeOf('function');
    expect(AuthenticationError).toBeTypeOf('function');
    expect(AuthorizationError).toBeTypeOf('function');
    expect(ConflictError).toBeTypeOf('function');
  });

  it('should maintain the error inheritance hierarchy', () => {
    const errors = [
      new ValidationError('Invalid input'),
      new AuthenticationError(),
      new AuthorizationError(),
      new ConflictError(),
    ];

    for (const error of errors) {
      expect(error).toBeInstanceOf(AuthBridgeError);
    }
  });
});
