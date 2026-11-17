import { describe, it, expect } from 'vitest';
import { validateConfig } from '../../src/core/config-validator.js';

const validConfig = {
  userRepository: {
    createUser: async () => ({}),
    findByEmail: async () => null,
    findById: async () => null,
  },
  jwtSecret: 'test-only-secret-with-at-least-32-characters',
};

describe('Configuration Validator', () => {
  it('should accept valid configuration', () => {
    expect(() => validateConfig(validConfig)).not.toThrow();
  });

  it('should reject missing configuration', () => {
    expect(() => validateConfig()).toThrow('AuthBridge configuration is required');
  });

  it('should reject missing repository methods', () => {
    const config = {
      ...validConfig,
      userRepository: {
        createUser: async () => ({}),
      },
    };

    expect(() => validateConfig(config)).toThrow('userRepository must implement findByEmail()');
  });

  it('should reject a weak JWT secret', () => {
    const config = {
      ...validConfig,
      jwtSecret: 'short',
    };

    expect(() => validateConfig(config)).toThrow(
      'JWT secret must be a string of at least 32 characters'
    );
  });

  it('should reject an empty token expiry', () => {
    const config = {
      ...validConfig,
      tokenExpiry: '',
    };

    expect(() => validateConfig(config)).toThrow('tokenExpiry must be a non-empty string');
  });
  it('should reject an invalid token expiry format', () => {
    const config = {
      ...validConfig,
      tokenExpiry: 'invalid-value',
    };

    expect(() => validateConfig(config)).toThrow('tokenExpiry must be a valid duration string');
  });
  it('should reject an invalid audience', () => {
    const config = {
      ...validConfig,
      audience: [],
    };

    expect(() => validateConfig(config)).toThrow(
      'audience must be a non-empty string or array of strings'
    );
  });
  it('should reject an array as configuration', () => {
    expect(() => validateConfig([])).toThrow('AuthBridge configuration is required');
  });

  it('should reject an array as userRepository', () => {
    const config = {
      ...validConfig,
      userRepository: [],
    };

    expect(() => validateConfig(config)).toThrow('A valid userRepository must be provided');
  });

  it('should reject a whitespace-only JWT secret', () => {
    const config = {
      ...validConfig,
      jwtSecret: '                                ',
    };

    expect(() => validateConfig(config)).toThrow(
      'JWT secret must be a string of at least 32 characters'
    );
  });
});
