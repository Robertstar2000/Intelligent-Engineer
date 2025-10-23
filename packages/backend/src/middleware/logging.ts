import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export interface LogEntry {
  timestamp: string;
  method: string;
  url: string;
  statusCode?: number;
  responseTime?: number;
  userAgent?: string;
  ip: string;
  userId?: string;
  error?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 10000;

  log(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output based on log level
    if (config.logging.level === 'debug' || config.nodeEnv === 'development') {
      console.log(JSON.stringify(entry, null, 2));
    } else {
      const { method, url, statusCode, responseTime, userId } = entry;
      const userInfo = userId ? ` [User: ${userId}]` : '';
      console.log(`${method} ${url} ${statusCode} ${responseTime}ms${userInfo}`);
    }
  }

  getLogs(limit = 100): LogEntry[] {
    return this.logs.slice(-limit);
  }

  getErrorLogs(limit = 50): LogEntry[] {
    return this.logs
      .filter(log => log.statusCode && log.statusCode >= 400)
      .slice(-limit);
  }
}

export const logger = new Logger();

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const originalSend = res.send;

  // Override res.send to capture response
  res.send = function(body: any) {
    const responseTime = Date.now() - startTime;
    
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: (req as any).user?.id,
    };

    // Add error details for error responses
    if (res.statusCode >= 400) {
      try {
        const errorBody = typeof body === 'string' ? JSON.parse(body) : body;
        logEntry.error = errorBody.error || errorBody.message || 'Unknown error';
      } catch (e) {
        logEntry.error = 'Failed to parse error response';
      }
    }

    logger.log(logEntry);
    return originalSend.call(this, body);
  };

  next();
};

export const errorLogger = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode || 500,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: (req as any).user?.id,
    error: error.message,
  };

  logger.log(logEntry);
  next(error);
};

// Audit logging for sensitive operations
export const auditLog = (action: string, resourceType: string, resourceId: string, userId?: string, details?: any): void => {
  const auditEntry = {
    timestamp: new Date().toISOString(),
    action,
    resourceType,
    resourceId,
    userId,
    details,
    type: 'AUDIT'
  };

  // In production, this would go to a secure audit log system
  console.log('AUDIT:', JSON.stringify(auditEntry));
  
  // Store in database audit_events table
  // This would be implemented with the audit repository
};