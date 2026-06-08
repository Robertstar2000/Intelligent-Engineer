
import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
    const app = express();
    const PORT = Number(process.env.PORT) || 3000;

    app.use(cors({
      origin: [
        'https://mifeco.com',
        'https://www.mifeco.com',
        'http://localhost:3001',
        'http://localhost:5173',
      ],
      credentials: true,
    }));
    app.use(express.json());

    // Initialize SQLite
    const db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE,
            email TEXT UNIQUE,
            passwordHash TEXT,
            geminiKey TEXT,
            role TEXT,
            avatar TEXT,
            tier TEXT DEFAULT 'free',
            stripeCustomerId TEXT,
            subscriptionStatus TEXT,
            subscriptionEndsAt TEXT
        )
    `);

    // Migration: add tier columns if they don't exist (for existing databases)
    try {
        await db.exec(`ALTER TABLE users ADD COLUMN tier TEXT DEFAULT 'free'`);
    } catch {}
    try {
        await db.exec(`ALTER TABLE users ADD COLUMN stripeCustomerId TEXT`);
    } catch {}
    try {
        await db.exec(`ALTER TABLE users ADD COLUMN subscriptionStatus TEXT`);
    } catch {}
    try {
        await db.exec(`ALTER TABLE users ADD COLUMN subscriptionEndsAt TEXT`);
    } catch {}

    // Auth Routes
    app.post('/api/auth/signup', async (req, res) => {
        const { username, email, password, geminiKey } = req.body;
        try {
            const id = Math.random().toString(36).substring(2, 15);
            const passwordHash = await bcrypt.hash(password, 10);
            await db.run(
                'INSERT INTO users (id, username, email, passwordHash, geminiKey, role, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [id, username, email, passwordHash, geminiKey, 'Engineer', '👤']
            );
            const user = { id, username, email, geminiKey, role: 'Engineer', avatar: '👤' };
            res.json({ success: true, user });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    });

    app.post('/api/auth/login', async (req, res) => {
        const { emailOrUsername, password } = req.body;
        try {
            const user = await db.get(
                'SELECT * FROM users WHERE email = ? OR username = ?',
                [emailOrUsername, emailOrUsername]
            );

            if (user && await bcrypt.compare(password, user.passwordHash)) {
                const { passwordHash, ...userWithoutPassword } = user;
                res.json({ success: true, user: userWithoutPassword });
            } else {
                res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // -- Tier & Billing API --

    // GET /api/user/tier — returns current user's tier info
    app.get('/api/user/tier', async (req, res) => {
        const { userId } = req.query;
        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({ success: false, message: 'userId is required' });
        }
        try {
            const user = await db.get(
                'SELECT id, email, username, tier, subscriptionStatus, subscriptionEndsAt FROM users WHERE id = ?',
                [userId]
            );
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            res.json({ success: true, tier: user.tier || 'free', subscriptionStatus: user.subscriptionStatus || null, subscriptionEndsAt: user.subscriptionEndsAt || null });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // PUT /api/user/tier — manually update tier (admin/debug use)
    app.put('/api/user/tier', async (req, res) => {
        const { userId, tier, subscriptionStatus, subscriptionEndsAt } = req.body;
        if (!userId || !tier) {
            return res.status(400).json({ success: false, message: 'userId and tier are required' });
        }
        if (tier !== 'free' && tier !== 'pro') {
            return res.status(400).json({ success: false, message: 'tier must be "free" or "pro"' });
        }
        try {
            await db.run(
                'UPDATE users SET tier = ?, subscriptionStatus = ?, subscriptionEndsAt = ? WHERE id = ?',
                [tier, subscriptionStatus || null, subscriptionEndsAt || null, userId]
            );
            res.json({ success: true, tier });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // POST /api/webhook/stripe — Stripe webhook handler
    app.post('/api/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
        const sig = req.headers['stripe-signature'];
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!webhookSecret || !sig) {
            console.warn('[Stripe Webhook] Missing secret or signature');
            // For now, just log and return 200 so Stripe doesn't retry endlessly in dev
            return res.status(200).json({ received: true, warning: 'Webhook secret not configured' });
        }

        try {
            // In production, use: const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
            // const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
            const event = JSON.parse(req.body);

            switch (event.type) {
                case 'checkout.session.completed': {
                    const session = event.data.object;
                    const customerId = session.customer;
                    const customerEmail = session.customer_email || session.customer_details?.email;
                    console.log(`[Stripe] Checkout completed for ${customerEmail}, customer: ${customerId}`);

                    // Update user tier to pro
                    await db.run(
                        `UPDATE users SET tier = 'pro', stripeCustomerId = ?, subscriptionStatus = 'active'
                         WHERE email = ? OR stripeCustomerId = ?`,
                        [customerId, customerId, customerEmail]
                    );
                    break;
                }
                case 'customer.subscription.deleted': {
                    const subscription = event.data.object;
                    const customerId = subscription.customer;
                    console.log(`[Stripe] Subscription cancelled for customer: ${customerId}`);

                    // Downgrade user to free
                    await db.run(
                        `UPDATE users SET tier = 'free', subscriptionStatus = 'cancelled', subscriptionEndsAt = ?
                         WHERE stripeCustomerId = ?`,
                        [new Date(subscription.current_period_end * 1000).toISOString(), customerId]
                    );
                }
                    break;
                case 'customer.subscription.updated': {
                    const subscription = event.data.object;
                    const customerId = subscription.customer;
                    console.log(`[Stripe] Subscription updated for customer: ${customerId}`);

                    await db.run(
                        `UPDATE users SET subscriptionStatus = ?, subscriptionEndsAt = ?
                         WHERE stripeCustomerId = ?`,
                        [subscription.status, new Date(subscription.current_period_end * 1000).toISOString(), customerId]
                    );
                    break;
                }
                default:
                    console.log(`[Stripe] Unhandled event type: ${event.type}`);
            }

            res.json({ received: true });
        } catch (error: any) {
            console.error('[Stripe Webhook] Error:', error.message);
            res.status(400).json({ error: `Webhook Error: ${error.message}` });
        }
    });

    // GET /api/health — health check
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', product: 'mifeco-vibraengineer', tier: 'free' });
    });

    if (process.env.NODE_ENV !== 'production') {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'spa',
        });
        app.use(vite.middlewares);
    } else {
        app.use(express.static(path.join(__dirname, 'dist')));
        app.get('/*', (req, res) => {
            res.sendFile(path.join(__dirname, 'dist', 'index.html'));
        });
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();
