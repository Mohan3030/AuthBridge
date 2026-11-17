import argon2 from 'argon2';

const DEFAULT_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

const MAX_PASSWORD_LENGTH = 1024;

function validatePassword(password) {
  if (typeof password !== 'string' || password.length === 0) {
    throw new TypeError('Password must be a non-empty string');
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new TypeError('Password exceeds the maximum allowed length');
  }
}

export async function hashPassword(password) {
  validatePassword(password);

  return argon2.hash(password, DEFAULT_OPTIONS);
}

export async function verifyPassword(password, hash) {
  validatePassword(password);

  if (typeof hash !== 'string' || hash.length === 0) {
    throw new TypeError('Password hash must be a non-empty string');
  }

  return argon2.verify(hash, password);
}
