import { AuthBridgeError } from './authbridge-error.js';

export class AuthorizationError extends AuthBridgeError {
  constructor(message = 'Insufficient permissions') {
    super(message, {
      code: 'AUTHORIZATION_ERROR',
      statusCode: 403,
    });
  }
}
