import { verifyPassword } from '../services/password.service.js';
import { generateToken } from '../services/token.service.js';
import { ValidationError } from '../errors/validation-error.js';
import { AuthenticationError } from '../errors/authentication-error.js';

export function validateLoginInput(credentials) {
  if (!credentials || typeof credentials !== 'object' || Array.isArray(credentials)) {
    throw new ValidationError('Login credentials are required');
  }

  const { email, password } = credentials;

  if (
    typeof email !== 'string' ||
    email.trim() === '' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    throw new ValidationError('A valid email address is required');
  }

  if (typeof password !== 'string' || password.length === 0) {
    throw new ValidationError('Password must be a non-empty string');
  }

  if (password.length > 1024) {
    throw new ValidationError('Password exceeds the maximum allowed length');
  }
}

export async function loginUser(credentials, userRepository, config) {
  validateLoginInput(credentials);

  const email = credentials.email.trim().toLowerCase();

  const user = await userRepository.findByEmail(email);

  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  const isPasswordValid = await verifyPassword(credentials.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AuthenticationError('Invalid email or password');
  }

  const accessToken = await generateToken(user, config);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles,
    },
    accessToken,
  };
}
