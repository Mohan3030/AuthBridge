export class AuthBridgeError extends Error {
  constructor(message, { code = 'AUTHBRIDGE_ERROR', statusCode = 500 } = {}) {
    super(message);

    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;

    Error.captureStackTrace?.(this, this.constructor);
  }
}
