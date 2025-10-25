import { Pool, PoolConfig } from 'pg';
import { config } from '../config';

// Database connection pool
let pool: Pool | null = null;

export const createPool = (): Pool => {
  if (pool) {
    return pool;
  }

  const poolConfig: PoolConfig = {
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password,
    ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
    max: config.database.maxConnections,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };

  pool = new Pool(poolConfig);

  // Handle pool errors
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });

  // Handle pool connection
  pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
  });

  return pool;
};

export const getPool = (): Pool => {
  if (!pool) {
    return createPool();
  }
  return pool;
};

export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

// Database query helper
export const query = async (text: string, params?: any[]): Promise<any> => {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

// Transaction helper
export const transaction = async <T>(
  callback: (client: any) => Promise<T>
): Promise<T> => {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Health check
export const healthCheck = async (): Promise<boolean> => {
  try {
    const result = await query('SELECT 1 as health');
    return result.rows[0].health === 1;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};

// Export db as an alias for getPool for backward compatibility
export const db = getPool();