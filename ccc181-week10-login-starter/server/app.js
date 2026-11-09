import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const users = [
  {
    id: 1,
    name: 'Demo Student',
    email: 'student@campusconnect.test',
    // Public classroom fixture only. Never use real credentials here.
    passwordHash: bcrypt.hashSync('Campus26', 10),
  },
];
const publicUser = ({ id, name, email }) => ({ id, name, email });

export function requireAuth(secret) {
  return (req, res, next) => {
    const authorization = req.get('Authorization') || '';
    const match = /^Bearer ([^\s]+)$/i.exec(authorization);
    if (!match) return res.status(401).json({ error: 'Not logged in.' });

    try {
      const claims = jwt.verify(match[1], secret, { algorithms: ['HS256'] });
      if (typeof claims !== 'object' || typeof claims.sub !== 'string'
          || typeof claims.exp !== 'number') {
        return res.status(401).json({ error: 'Not logged in.' });
      }
      const user = users.find((candidate) => String(candidate.id) === claims.sub);
      if (!user) return res.status(401).json({ error: 'Not logged in.' });
      req.user = publicUser(user);
      next();
    } catch {
      return res.status(401).json({ error: 'Not logged in.' });
    }
  };
}

export function notFound(_req, res) {
  res.status(404).json({ error: 'Not found.' });
}

export function errorHandler(error, _req, res, next) {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed' || error.type === 'entity.too.large') {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  return res.status(500).json({ error: 'Something went wrong.' });
}

export function createApp({ secret, clientOrigin }) {
  if (!secret || !clientOrigin) throw new Error('API configuration is required.');
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: clientOrigin, methods: ['GET', 'POST', 'OPTIONS'] }));
  app.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  app.use(express.json({ limit: '16kb' }));

  app.get('/api/v1/health', (_req, res) => res.status(200).json({ status: 'ok' }));

  app.post('/api/v1/sessions', async (req, res) => {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string'
        || !EMAIL_PATTERN.test(email.trim()) || password.length === 0) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const user = users.find((candidate) => candidate.email === email.trim().toLowerCase());
    // Still compare a hash for unknown emails, avoiding an obvious timing shortcut.
    const correctPassword = await bcrypt.compare(password, (user || users[0]).passwordHash);
    if (!user || !correctPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const token = jwt.sign({}, secret, {
      algorithm: 'HS256', subject: String(user.id), expiresIn: '1h',
    });
    return res.status(200).json({ token, user: publicUser(user) });
  });

  app.get('/api/v1/users/me', requireAuth(secret), (req, res) => {
    res.status(200).json(req.user);
  });
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
