import { validateConfig } from './config-validator.js';
import { registerUser } from './registration.js';
import { loginUser } from './login.js';
import { verifyToken } from '../services/token.service.js';
import { createAuthenticateMiddleware } from '../middleware/authenticate.js';
import { createAuthorizeMiddleware } from '../middleware/authorize.js';

export function createAuth(config) {
  validateConfig(config);

  const { userRepository } = config;
  const authenticate = createAuthenticateMiddleware(userRepository, (token) =>
    verifyToken(token, config)
  );
  const authorize = createAuthorizeMiddleware();
  return {
    register(data) {
      return registerUser(data, userRepository);
    },

    login(credentials) {
      return loginUser(credentials, userRepository, config);
    },
    authenticate,
    authorize,
  };
}
