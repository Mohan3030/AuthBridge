# AuthBridge

**A reusable, database-independent authentication library for Node.js applications.**

AuthBridge provides reusable authentication and authorization functionality for Express applications without being tied to a specific database.

Instead of managing database connections or schemas, AuthBridge allows consuming applications to provide their own user repository.

## Features

- User registration and login.
- Password hashing and verification using Argon2id.
- JWT generation and verification using `jose`.
- Express authentication middleware.
- Role-based authorization middleware.
- Database-independent architecture.
- Centralized authentication errors.
- Unit testing with Vitest.
- Automated code quality checks using GitHub Actions.

## Architecture

AuthBridge separates authentication logic from database operations.

```text
        Consumer Application
                |
                v
          AuthBridge API
                |
       +--------+--------+
       |        |        |
   Register   Login   Middleware
       |        |        |
       +--------+--------+
                |
        User Repository
                |
                v
        Consumer Database
```

**AuthBridge responsibilities**

- Registration and login logic.
- Password hashing and verification.
- JWT creation and verification.
- Authentication and authorization middleware.
- Authentication-related errors.

**Consumer application responsibilities**

- Database connection and configuration.
- User table or collection design.
- Persisting and retrieving users.
- Enforcing unique email constraints.
- Assigning trusted user roles.
- Handling HTTP responses and token delivery.

## Technology Stack

| Technology              | Purpose                         |
| ----------------------- | ------------------------------- |
| Node.js                 | Runtime                         |
| JavaScript (ES Modules) | Implementation                  |
| Express.js              | Middleware integration          |
| Argon2id                | Password hashing                |
| jose                    | JWT generation and verification |
| Vitest                  | Unit testing                    |
| ESLint                  | Code quality                    |
| Prettier                | Code formatting                 |
| GitHub Actions          | Continuous integration          |

**Requirements:** Node.js 24 or later.

## Installation

AuthBridge is currently developed as a local package.

To integrate the package into another local Node.js application:

```bash
npm install ../path-to/AuthBridge
```

After publication, it can be installed using:

```bash
npm install authbridge
```

## Quick Start

### 1. Create a user repository

The consuming application must implement three methods:

| Method                 | Responsibility                                |
| ---------------------- | --------------------------------------------- |
| `createUser(userData)` | Save a new user and return the created record |
| `findByEmail(email)`   | Find a user by normalized email               |
| `findById(id)`         | Find a user by ID                             |

Expected user structure:

```javascript
{
  id: 'user-123',
  name: 'John Doe',
  email: 'john@example.com',
  passwordHash: 'argon2-hash',
  roles: ['user']
}
```

### 2. Configure AuthBridge

```javascript
import { createAuth } from 'authbridge';

const auth = createAuth({
  userRepository,
  jwtSecret: process.env.JWT_SECRET,
  tokenExpiry: '15m',
});
```

Optional configuration:

- `issuer`: JWT issuer. Defaults to `authbridge`.
- `audience`: Expected JWT audience.

### 3. Register a user

```javascript
const user = await auth.register({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'StrongPassword123!',
});
```

### 4. Login

```javascript
const result = await auth.login({
  email: 'john@example.com',
  password: 'StrongPassword123!',
});

console.log(result.accessToken);
```

The login operation returns the user information and access token.

### 5. Protect Express routes

```javascript
app.get('/profile', auth.authenticate, (req, res) => {
  res.json({ user: req.user });
});
```

### 6. Implement role-based authorization

```javascript
app.get('/admin', auth.authenticate, auth.authorize('admin'), (req, res) => {
  res.json({ message: 'Admin access granted' });
});
```

The consumer application is responsible for assigning trusted roles. Roles must never be accepted directly from public registration input.

## Important: User Repository Contract

AuthBridge does not connect directly to a database.

The consuming application must provide a `userRepository` implementing:

- `createUser(userData)`
- `findByEmail(email)`
- `findById(id)`

### Email uniqueness

The consumer's database must enforce a **UNIQUE constraint** on the email column.

The `findByEmail()` check in AuthBridge alone cannot prevent simultaneous duplicate registrations.

If `createUser()` encounters a database duplicate-key error, the repository must translate it into AuthBridge's `ConflictError`.

Other database errors should propagate normally.

This keeps database-specific logic inside the consumer application.

## Error Handling

AuthBridge exports the following error classes:

| Error                 | HTTP status | Purpose                     |
| --------------------- | ----------: | --------------------------- |
| `AuthBridgeError`     |  Base class | Common authentication error |
| `ValidationError`     |         400 | Invalid input               |
| `AuthenticationError` |         401 | Authentication failure      |
| `AuthorizationError`  |         403 | Insufficient permissions    |
| `ConflictError`       |         409 | Duplicate resource          |

The consumer application should implement centralized Express error handling and avoid exposing internal errors to clients.

## Security Considerations

- Passwords are hashed using Argon2id.
- JWT verification restricts the accepted signing algorithm to HS256.
- Tokens have an expiration time.
- Invalid and expired tokens are rejected.
- Authentication middleware retrieves the latest user record from the repository.
- Authorization checks use current database roles.
- Password hashes are excluded from the authenticated request user object.
- The consumer must generate a cryptographically random JWT secret and store it in environment variables.

Generate a secret using:

```bash
openssl rand -base64 32
```

The consumer application should also implement appropriate rate limiting for authentication endpoints.

## Running the Consumer Demo

The repository includes a sample Express consumer application.

```bash
cd examples/consumer
npm install
```

Create a `.env` file containing:

```env
JWT_SECRET=your-generated-secret
PORT=3000
```

Start the application:

```bash
npm start
```

The demo uses an in-memory repository for simplicity. User records are not persisted after the application restarts.

## Running Tests

From the project root:

```bash
npm install
npm test
```

Run the other quality checks:

```bash
npm run lint
npm run format:check
npm run test:coverage
```

## Project Structure

```text
AuthBridge/
├── src/
│   ├── core/
│   │   ├── auth.js
│   │   ├── config-validator.js
│   │   ├── login.js
│   │   └── registration.js
│   ├── errors/
│   ├── middleware/
│   │   ├── authenticate.js
│   │   └── authorize.js
│   ├── services/
│   │   ├── password.service.js
│   │   └── token.service.js
│   └── index.js
├── tests/
│   └── unit/
├── examples/
│   └── consumer/
├── .github/
│   └── workflows/
├── package.json
└── README.md
```

## Future Enhancements

- Refresh token support.
- OAuth integration.
- Email verification.
- Password reset functionality.
- Multi-factor authentication.

## License

MIT License.
