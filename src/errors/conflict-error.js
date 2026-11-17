import { AuthBridgeError } from './authbridge-error.js';

export class ConflictError extends AuthBridgeError {
  constructor(message = 'Resource already exists') {
    super(message, {
      code: 'CONFLICT_ERROR',
      statusCode: 409,
    });
  }
}
