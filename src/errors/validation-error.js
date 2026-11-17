import { AuthBridgeError } from './authbridge-error.js';

export class ValidationError extends AuthBridgeError {
  constructor(message) {
    super(message, {
      code: 'VALIDATION_ERROR',
      statusCode: 400,
    });
  }
}
