import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../database/connection';
import { config } from '../config';
import { authRateLimit } from '../middleware/rateLimiter';
import { auditLog } from '../middleware/logging';

const router = Router();

// Apply rate limiting to auth routes
router.use(authRateLimit);

// POST /api/auth/register - Register a new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, organizationName } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'Missing required fields: email, password, name' 
      });
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = config.security.bcryptRounds;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create organization if provided
    let organizationId = null;
    if (organizationName) {
      const orgResult = await query(
        'INSERT INTO organizations (name) VALUES ($1) RETURNING id',
        [organizationName]
      );
      organizationId = orgResult.rows[0].id;
    }

    // Create user
    const userResult = await query(`
      INSERT INTO users (email, password_hash, name, organization_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, name, organization_id, created_at
    `, [email.toLowerCase(), passwordHash, name, organizationId]);

    const user = userResult.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Audit log
    auditLog('USER_REGISTER', 'user', user.id, user.id, {
      email: user.email,
      organizationId,
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        organizationId: user.organization_id,
      },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields: email, password' 
      });
    }

    // Find user
    const userResult = await query(`
      SELECT id, email, password_hash, name, organization_id, is_active
      FROM users 
      WHERE email = $1
    `, [email.toLowerCase()]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userResult.rows[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      auditLog('LOGIN_FAILED', 'user', user.id, user.id, {
        email: user.email,
        reason: 'invalid_password',
      });
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last activity
    await query(
      'UPDATE users SET last_activity = NOW() WHERE id = $1',
      [user.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Audit log
    auditLog('LOGIN_SUCCESS', 'user', user.id, user.id, {
      email: user.email,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        organizationId: user.organization_id,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// POST /api/auth/refresh - Refresh JWT token
router.post('/refresh', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    // Verify the existing token (even if expired)
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        // Allow expired tokens for refresh
        decoded = jwt.decode(token) as any;
      } else {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    if (!decoded || typeof decoded === 'string') {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    // Verify user still exists and is active
    const userResult = await query(
      'SELECT id, email, name, organization_id FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    const user = userResult.rows[0];

    // Generate new token
    const newToken = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        organizationId: user.organization_id,
      },
      token: newToken,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// POST /api/auth/logout - Logout user (client-side token removal)
router.post('/logout', (req, res) => {
  // In a more sophisticated implementation, we might maintain a token blacklist
  // For now, we rely on client-side token removal
  res.json({ message: 'Logged out successfully' });
});

export default router;