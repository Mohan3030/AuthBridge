AuthBridge
A reusable, database-independent authentication library for Node.js
applications.
User Repository Contract
AuthBridge does not connect directly to a database. The consuming
application must provide a userRepository implementing these methods:

Method Responsibility
createUser(userData) Persist a new user and return the created user
findByEmail(email) Find a user by normalized email
findById(id) Find a user by ID
Expected User Structure
A user returned by the repository should contain:

- id
- name
- email
- passwordHash
- roles
  Important: Email Uniqueness
  The consumer's database must enforce a UNIQUE constraint on the
  email column.

The findByEmail() check in AuthBridge is not sufficient to prevent
simultaneous duplicate registrations.

If createUser() encounters a database duplicate-key error, the
repository must translate it into AuthBridge's ConflictError.

Other database errors should propagate normally.

This keeps database-specific logic inside the consumer application.
Repository Responsibilities
The consumer application is responsible for:

- Database connection and configuration.
- User table or collection design.
- Unique email constraints.
- Persisting user records.
- Assigning trusted user roles.
- Translating database-specific duplicate-key errors into
  ConflictError.
