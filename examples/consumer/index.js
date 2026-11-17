import 'dotenv/config';
import express from 'express';
import { createAuth, AuthBridgeError } from 'authbridge';

const app = express();

app.use(express.json());

// Temporary in-memory user storage.
// In a real application, this would be replaced by a database.
const users = [];

const userRepository = {
  async createUser(userData) {
    const user = {
      id: String(users.length + 1),
      ...userData,
      roles: ['user'],
    };

    users.push(user);
    return user;
  },

  async findByEmail(email) {
    return users.find((user) => user.email === email) ?? null;
  },

  async findById(id) {
    return users.find((user) => user.id === id) ?? null;
  },
};

// Initialize AuthBridge with consumer-owned dependencies.
const auth = createAuth({
  userRepository,
  jwtSecret: process.env.JWT_SECRET,
  tokenExpiry: '15m',
});

app.get('/', (req, res) => {
  res.json({
    message: 'AuthBridge consumer application is running',
  });
});

app.post('/register', async (req, res, next) => {
  try {
    const user = await auth.register(req.body);

    return res.status(201).json({
      message: 'Registration successful',
      user,
    });
  } catch (error) {
    return next(error);
  }
});

app.post('/login', async (req, res, next) => {
  try {
    const result = await auth.login(req.body);

    return res.status(200).json({
      message: 'Login successful',
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error) {
    return next(error);
  }
});
app.get('/profile', auth.authenticate, (req, res) => {
  return res.status(200).json({
    message: 'Authenticated successfully',
    user: req.user,
  });
});
app.get('/admin', auth.authenticate, auth.authorize('admin'), (req, res) => {
  return res.status(200).json({
    message: 'Welcome to the admin area',
    user: req.user,
  });
});
app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof AuthBridgeError) {
    return res.status(error.statusCode).json({
      code: error.code,
      message: error.message,
    });
  }

  console.error(error); // eslint-disable-line no-console
  return res.status(500).json({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
  });
});
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Consumer application running on port ${PORT}`); // eslint-disable-line no-console
});
