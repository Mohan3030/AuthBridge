import { describe, it, expect, vi } from 'vitest';

import { createAuthenticateMiddleware } from '../../src/middleware/authenticate.js';
import { AuthenticationError } from '../../src/errors/authentication-error.js';

describe('Authentication Middleware', () => {
  it('should authenticate a valid token and attach the user', async () => {
    const user = {
      id: 'user-123',
      name: 'Mohan',
      email: 'mohan@example.com',
      roles: ['user'],
      passwordHash: 'secret-hash',
    };

    const userRepository = {
      findById: vi.fn().mockResolvedValue(user),
    };

    const verifyToken = vi.fn().mockResolvedValue({
      sub: 'user-123',
      roles: ['user'],
    });

    const authenticate = createAuthenticateMiddleware(userRepository, verifyToken);

    const req = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    };

    const next = vi.fn();

    await authenticate(req, {}, next);

    expect(verifyToken).toHaveBeenCalledWith('valid-token');
    expect(userRepository.findById).toHaveBeenCalledWith('user-123');

    expect(req.user).toEqual({
      id: 'user-123',
      name: 'Mohan',
      email: 'mohan@example.com',
      roles: ['user'],
    });

    expect(req.user.passwordHash).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });

  it('should reject a request without an authorization header', async () => {
    const authenticate = createAuthenticateMiddleware({ findById: vi.fn() }, vi.fn());

    const req = { headers: {} };
    const next = vi.fn();

    await authenticate(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));

    const error = next.mock.calls[0][0];

    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Authentication required');
  });

  it('should reject a malformed authorization header', async () => {
    const authenticate = createAuthenticateMiddleware({ findById: vi.fn() }, vi.fn());

    const req = {
      headers: {
        authorization: 'Basic some-token',
      },
    };

    const next = vi.fn();

    await authenticate(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
  });

  it('should reject an empty Bearer token', async () => {
    const authenticate = createAuthenticateMiddleware({ findById: vi.fn() }, vi.fn());

    const req = {
      headers: {
        authorization: 'Bearer ',
      },
    };

    const next = vi.fn();

    await authenticate(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
  });

  it('should convert invalid token errors into AuthenticationError', async () => {
    const verificationError = new Error('Internal JWT verification details');

    const verifyToken = vi.fn().mockRejectedValue(verificationError);

    const authenticate = createAuthenticateMiddleware({ findById: vi.fn() }, verifyToken);

    const req = {
      headers: {
        authorization: 'Bearer invalid-token',
      },
    };

    const next = vi.fn();

    await authenticate(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));

    const error = next.mock.calls[0][0];

    expect(error.message).toBe('Authentication required');
    expect(error.message).not.toContain('Internal JWT verification details');
  });

  it('should reject a token belonging to a deleted user', async () => {
    const userRepository = {
      findById: vi.fn().mockResolvedValue(null),
    };

    const verifyToken = vi.fn().mockResolvedValue({
      sub: 'deleted-user',
      roles: ['user'],
    });

    const authenticate = createAuthenticateMiddleware(userRepository, verifyToken);

    const req = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    };

    const next = vi.fn();

    await authenticate(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
  });

  it('should forward database errors without converting them', async () => {
    const databaseError = new Error('Database connection failed');

    const userRepository = {
      findById: vi.fn().mockRejectedValue(databaseError),
    };

    const verifyToken = vi.fn().mockResolvedValue({
      sub: 'user-123',
      roles: ['user'],
    });

    const authenticate = createAuthenticateMiddleware(userRepository, verifyToken);

    const req = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    };

    const next = vi.fn();

    await authenticate(req, {}, next);

    expect(next).toHaveBeenCalledWith(databaseError);
    expect(next.mock.calls[0][0]).not.toBeInstanceOf(AuthenticationError);
  });
});
