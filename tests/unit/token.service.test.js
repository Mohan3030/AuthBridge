import { describe, it, expect } from 'vitest';
import { jwtVerify, SignJWT } from 'jose';
import { generateToken, verifyToken } from '../../src/services/token.service.js';
const TEST_SECRET = 'test-only-secret-with-at-least-32-characters';

const TEST_CONFIG = {
  jwtSecret: TEST_SECRET,
  tokenExpiry: '15m',
};

const TEST_USER = {
  id: 'user-123',
  roles: ['user', 'admin'],
};

const secretKey = new TextEncoder().encode(TEST_SECRET);

describe('Token Service', () => {
  it('should generate a valid JWT', async () => {
    const token = await generateToken(TEST_USER, TEST_CONFIG);

    expect(token).toBeTypeOf('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('should contain the correct user ID and roles', async () => {
    const token = await generateToken(TEST_USER, TEST_CONFIG);

    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
      issuer: 'authbridge',
    });

    expect(payload.sub).toBe('user-123');
    expect(payload.roles).toEqual(['user', 'admin']);
  });

  it('should contain the configured issuer and expiry', async () => {
    const token = await generateToken(TEST_USER, TEST_CONFIG);

    const { payload } = await jwtVerify(token, secretKey);

    expect(payload.iss).toBe('authbridge');
    expect(payload.exp).toBeTypeOf('number');
    expect(payload.iat).toBeTypeOf('number');
    expect(payload.exp).toBeGreaterThan(payload.iat);
  });

  it('should include audience when configured', async () => {
    const config = {
      ...TEST_CONFIG,
      audience: 'my-application',
    };

    const token = await generateToken(TEST_USER, config);

    const { payload } = await jwtVerify(token, secretKey, {
      audience: 'my-application',
    });

    expect(payload.aud).toBe('my-application');
  });

  it('should reject a missing user ID', async () => {
    const invalidUser = {
      roles: ['user'],
    };

    await expect(generateToken(invalidUser, TEST_CONFIG)).rejects.toThrow(
      'User must have a valid ID'
    );
  });

  it('should reject a weak JWT secret', async () => {
    const config = {
      ...TEST_CONFIG,
      jwtSecret: 'short',
    };

    await expect(generateToken(TEST_USER, config)).rejects.toThrow(
      'JWT secret must be a string of at least 32 characters'
    );
  });

  it('should return the verified payload for a valid token', async () => {
    const token = await generateToken(TEST_USER, TEST_CONFIG);

    const payload = await verifyToken(token, TEST_CONFIG);

    expect(payload.sub).toBe(TEST_USER.id);
    expect(payload.roles).toEqual(TEST_USER.roles);
  });

  it('should reject a tampered token', async () => {
    const token = await generateToken(TEST_USER, TEST_CONFIG);

    const [header, payload] = token.split('.');
    const tamperedToken = `${header}.${payload}tampered.${token.split('.')[2]}`;

    await expect(verifyToken(tamperedToken, TEST_CONFIG)).rejects.toThrow();
  });

  it('should reject a token signed with a different secret', async () => {
    const token = await generateToken(TEST_USER, TEST_CONFIG);

    const wrongConfig = {
      ...TEST_CONFIG,
      jwtSecret: 'another-test-secret-with-at-least-32-characters',
    };

    await expect(verifyToken(token, wrongConfig)).rejects.toThrow();
  });

  it('should reject an expired token', async () => {
    const expiredConfig = {
      ...TEST_CONFIG,
      tokenExpiry: '0s',
    };

    const token = await generateToken(TEST_USER, expiredConfig);

    await expect(verifyToken(token, expiredConfig)).rejects.toThrow();
  });
  it('should reject a token without an expiration claim', async () => {
    const token = await new SignJWT({
      roles: ['user'],
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject('user-123')
      .setIssuer('authbridge')
      .setIssuedAt()
      .sign(secretKey);

    await expect(verifyToken(token, TEST_CONFIG)).rejects.toThrow();
  });
  it('should reject an empty token', async () => {
    await expect(verifyToken('', TEST_CONFIG)).rejects.toThrow('Token must be a non-empty string');
  });
});
