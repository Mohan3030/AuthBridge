import { AuthBridgeError } from './authbridge-error.js';

export class AuthenticationError extends AuthBridgeError {
  constructor(message = 'Authentication required') {
    super(message, {
      code: 'AUTHENTICATION_ERROR',
      statusCode: 401,
    });
  }
}
