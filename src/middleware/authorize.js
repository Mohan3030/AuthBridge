import { AuthenticationError } from '../errors/authentication-error.js';
import { AuthorizationError } from '../errors/authorization-error.js';

export function createAuthorizeMiddleware() {
  return function authorize(...allowedRoles) {
    // Validate role configuration when the middleware is created.
    if (
      allowedRoles.length === 0 ||
      allowedRoles.some((role) => typeof role !== 'string' || role.trim() === '')
    ) {
      throw new TypeError('At least one valid role must be provided');
    }

    return function authorizationMiddleware(req, res, next) {
      // Authentication must happen before authorization.
      if (!req.user) {
        return next(new AuthenticationError());
      }

      // Check whether the authenticated user has at least one allowed role.
      const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [];

      const hasPermission = allowedRoles.some((role) => userRoles.includes(role));

      if (!hasPermission) {
        return next(new AuthorizationError());
      }

      return next();
    };
  };
}
