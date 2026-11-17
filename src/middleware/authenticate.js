import { AuthenticationError } from '../errors/authentication-error.js';

export function createAuthenticateMiddleware(userRepository, verifyToken) {
  return async function authenticate(req, res, next) {
    const authorization = req.headers?.authorization;

    // 1. Check whether the Authorization header exists.
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return next(new AuthenticationError());
    }

    const token = authorization.slice(7).trim();

    // 2. Reject an empty Bearer token.
    if (!token) {
      return next(new AuthenticationError());
    }

    let payload;

    // 3. Verify the JWT.
    // Invalid, expired, or tampered tokens become a generic 401 error.
    try {
      payload = await verifyToken(token);
    } catch {
      return next(new AuthenticationError());
    }

    // 4. Fetch the latest user from the repository.
    // Repository/database errors are forwarded unchanged.
    try {
      const user = await userRepository.findById(payload.sub);

      if (!user) {
        return next(new AuthenticationError());
      }

      // 5. Attach only safe user information to the request.
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles,
      };

      return next();
    } catch (error) {
      return next(error);
    }
  };
}
