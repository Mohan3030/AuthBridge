export function validateConfig(config) {
  if (!config || typeof config !== 'object') {
    throw new TypeError('AuthBridge configuration is required');
  }

  const { userRepository, jwtSecret, tokenExpiry, issuer, audience } = config;

  if (!userRepository || typeof userRepository !== 'object') {
    throw new TypeError('A valid userRepository must be provided');
  }

  const requiredMethods = ['createUser', 'findByEmail', 'findById'];

  for (const method of requiredMethods) {
    if (typeof userRepository[method] !== 'function') {
      throw new TypeError(`userRepository must implement ${method}()`);
    }
  }

  if (typeof jwtSecret !== 'string' || jwtSecret.length < 32) {
    throw new TypeError('JWT secret must be a string of at least 32 characters');
  }

  if (tokenExpiry !== undefined && (typeof tokenExpiry !== 'string' || tokenExpiry.trim() === '')) {
    throw new TypeError('tokenExpiry must be a non-empty string');
  }

  if (issuer !== undefined && (typeof issuer !== 'string' || issuer.trim() === '')) {
    throw new TypeError('issuer must be a non-empty string');
  }

  if (
    audience !== undefined &&
    !(
      (typeof audience === 'string' && audience.trim() !== '') ||
      (Array.isArray(audience) &&
        audience.length > 0 &&
        audience.every((item) => typeof item === 'string' && item.trim() !== ''))
    )
  ) {
    throw new TypeError('audience must be a non-empty string or array of strings');
  }
}
