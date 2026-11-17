import { hashPassword } from '../services/password.service.js';
import { ValidationError } from '../errors/validation-error.js';
import { ConflictError } from '../errors/conflict-error.js';

export function validateRegistrationInput(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ValidationError('Registration data is required');
  }

  const { name, email, password } = data;

  if (typeof name !== 'string' || name.trim() === '') {
    throw new ValidationError('Name must be a non-empty string');
  }

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

export async function registerUser(data, userRepository) {
  validateRegistrationInput(data);

  const name = data.name.trim();
  const email = data.email.trim().toLowerCase();

  const existingUser = await userRepository.findByEmail(email);

  if (existingUser) {
    throw new ConflictError('An account with this email already exists');
  }

  const passwordHash = await hashPassword(data.password);

  const createdUser = await userRepository.createUser({
    name,
    email,
    passwordHash,
  });

  return {
    id: createdUser.id,
    name: createdUser.name,
    email: createdUser.email,
    roles: createdUser.roles,
  };
}
