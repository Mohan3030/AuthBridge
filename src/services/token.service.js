import { SignJWT, jwtVerify } from 'jose';
const DEFAULT_ISSUER = 'authbridge';
const DEFAULT_TOKEN_EXPIRY = '15m';

function validateTokenInputs(user, config) {
  if (!config || typeof config.jwtSecret !== 'string' || config.jwtSecret.length < 32) {
    throw new TypeError('JWT secret must be a string of at least 32 characters');
  }

  if (!user || user.id === undefined || user.id === null || String(user.id).trim() === '') {
    throw new TypeError('User must have a valid ID');
  }

  if (
    !Array.isArray(user.roles) ||
    user.roles.some((role) => typeof role !== 'string' || role.trim() === '')
  ) {
    throw new TypeError('User roles must be an array of non-empty strings');
  }
}

export async function generateToken(user, config) {
  validateTokenInputs(user, config);

  const secretKey = new TextEncoder().encode(config.jwtSecret);
  const issuedAt = Math.floor(Date.now() / 1000);

  let jwt = new SignJWT({
    roles: user.roles,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(String(user.id))
    .setIssuedAt(issuedAt)
    .setExpirationTime(config.tokenExpiry ?? DEFAULT_TOKEN_EXPIRY)
    .setIssuer(config.issuer ?? DEFAULT_ISSUER);

  if (config.audience) {
    jwt = jwt.setAudience(config.audience);
  }

  return jwt.sign(secretKey);
}

export async function verifyToken(token, config) {
  if (typeof token !== 'string' || token.trim() === '') {
    throw new TypeError('Token must be a non-empty string');
  }

  if (!config || typeof config.jwtSecret !== 'string' || config.jwtSecret.length < 32) {
    throw new TypeError('JWT secret must be a string of at least 32 characters');
  }

  const secretKey = new TextEncoder().encode(config.jwtSecret);

  const verificationOptions = {
    algorithms: ['HS256'],
    issuer: config.issuer ?? DEFAULT_ISSUER,
  };

  if (config.audience) {
    verificationOptions.audience = config.audience;
  }

  const { payload } = await jwtVerify(token, secretKey, verificationOptions);
  if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) {
    throw new Error('Token must include a valid expiration claim');
  }
  if (
    typeof payload.sub !== 'string' ||
    payload.sub.trim() === '' ||
    !Array.isArray(payload.roles) ||
    payload.roles.some((role) => typeof role !== 'string' || role.trim() === '')
  ) {
    throw new Error('Invalid token payload');
  }

  return payload;
}
