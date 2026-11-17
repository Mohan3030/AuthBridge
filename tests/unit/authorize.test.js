import { describe, it, expect, vi } from 'vitest';

import { createAuthorizeMiddleware } from '../../src/middleware/authorize.js';
import { AuthenticationError } from '../../src/errors/authentication-error.js';
import { AuthorizationError } from '../../src/errors/authorization-error.js';

describe('Authorization Middleware', () => {
  it('should allow a user with the required role', () => {
    const authorize = createAuthorizeMiddleware();
    const middleware = authorize('admin');

    const req = {
      user: {
        id: 'user-123',
        roles: ['admin'],
      },
    };

    const next = vi.fn();

    middleware(req, {}, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should reject a user without the required role', () => {
    const authorize = createAuthorizeMiddleware();
    const middleware = authorize('admin');

    const req = {
      user: {
        id: 'user-123',
        roles: ['user'],
      },
    };

    const next = vi.fn();

    middleware(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(AuthorizationError));

    const error = next.mock.calls[0][0];

    expect(error.statusCode).toBe(403);
    expect(error.message).toBe('Insufficient permissions');
  });

  it('should allow a user with at least one of multiple roles', () => {
    const authorize = createAuthorizeMiddleware();
    const middleware = authorize('admin', 'moderator');

    const req = {
      user: {
        id: 'user-123',
        roles: ['moderator'],
      },
    };

    const next = vi.fn();

    middleware(req, {}, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should reject requests without an authenticated user', () => {
    const authorize = createAuthorizeMiddleware();
    const middleware = authorize('admin');

    const req = {};
    const next = vi.fn();

    middleware(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));

    const error = next.mock.calls[0][0];

    expect(error.statusCode).toBe(401);
  });

  it('should reject users with missing or invalid roles', () => {
    const authorize = createAuthorizeMiddleware();
    const middleware = authorize('admin');

    const req = {
      user: {
        id: 'user-123',
        roles: null,
      },
    };

    const next = vi.fn();

    middleware(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(AuthorizationError));
  });

  it('should reject authorization when no roles are provided', () => {
    const authorize = createAuthorizeMiddleware();

    expect(() => authorize()).toThrow('At least one valid role must be provided');
  });

  it('should reject invalid role values', () => {
    const authorize = createAuthorizeMiddleware();

    expect(() => authorize('admin', '')).toThrow('At least one valid role must be provided');
  });
});
