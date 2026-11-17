import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../../src/services/password.service.js';

describe('Password Service', () => {
  it('should generate an Argon2id hash for a valid password', async () => {
    const password = 'MyPassword123!';

    const hash = await hashPassword(password);

    expect(hash).toMatch(/^\$argon2id\$/);
    expect(hash).not.toBe(password);
  });
  it('should use the configured Argon2id security parameters', async () => {
    const hash = await hashPassword('MyPassword123!');

    expect(hash).toContain('$argon2id$v=19$m=19456,t=2,p=1$');
  });
  it('should verify the correct password', async () => {
    const password = 'MyPassword123!';
    const hash = await hashPassword(password);

    const result = await verifyPassword(password, hash);

    expect(result).toBe(true);
  });

  it('should reject an incorrect password', async () => {
    const hash = await hashPassword('MyPassword123!');

    const result = await verifyPassword('WrongPassword123!', hash);

    expect(result).toBe(false);
  });

  it('should reject an empty password during hashing', async () => {
    await expect(hashPassword('')).rejects.toThrow(TypeError);
  });

  it('should reject a non-string password', async () => {
    await expect(hashPassword(123456)).rejects.toThrow(TypeError);
  });
});
