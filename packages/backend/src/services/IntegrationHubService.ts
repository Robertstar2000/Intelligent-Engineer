import {
  Integration,
  IntegrationType,
  IntegrationStatus,
  IntegrationCredentials,
  IntegrationConfiguration,
  IntegrationHealth,
  IntegrationMetrics,
  IntegrationLog,
  IntegrationWebhook,
  CustomIntegration,
  IntegrationTemplate,
  IntegrationError,
} from '@shared/types';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

/**
 * Integration Hub Service
 * Central management system for all external tool integrations
 * Handles credential storage, API management, monitoring, and custom integrations
 */
export class IntegrationHubService {
  private integrations: Map<string, Integration> = new Map();
  private credentials: Map<string, IntegrationCredentials> = new Map();
  private healthChecks: Map<string, NodeJS.Timeout> = new Map();
  private webhooks: Map<string, IntegrationWebhook> = new Map();
  private customIntegrations: Map<string, CustomIntegration> = new Map();
  private logs: Map<string, IntegrationLog[]> = new Map();
  private encryptionKey: string;

  constructor() {
    // In production, this should come from environment variables or key management service
    this.encryptionKey = process.env.INTEGRATION_ENCRYPTION_KEY || 'default-key-change-in-production';
  }

  /**
   * Register a new integration
   */
  async registerIntegration(
    projectId: string,
    name: string,
    type: IntegrationType,
    provider: string,
    configuration: IntegrationConfiguration,
    credentials: IntegrationCredentials
  ): Promise<Integration> {
    try {
      const integrationId = uuidv4();
      
      // Encrypt and store credentials securely
      const encryptedCredentials = this.encryptCredentials(credentials);
      this.credentials.set(integrationId, encryptedCredentials);

      // Create integration record
      const integration: Integration = {
        id: integrationId,
        projectId,
        name,
        type,
        provider,
        status: 'pending',
        configuration,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSync: null,
        health: {
          status: 'unknown',
          lastCheck: new Date(),
          uptime: 0,
          responseTime: 0,
          errorRate: 0,
          lastError: null,
        },
        metrics: {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          averageResponseTime: 0,
          dataTransferred: 0,
          lastActivity: new Date(),
        },
      };

      // Store integration
      this.integrations.set(integrationId, integration);
      this.logs.set(integrationId, []);

      // Log registration
      this.addLog(integrationId, 'info', 'Integration registered', {
        name,
        type,
        provider,
      });

      // Test connection
      await this.testConnection(integrationId);

      // Start health monitoring
      this.startHealthMonitoring(integration);

      console.log(`Integration registered: ${name} (${integrationId})`);
      return integration;
    } catch (error) {
      console.error('Failed to register integration:', error);
      throw new Error(`Integration registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update integration configuration
   */
  async updateIntegration(
    integrationId: string,
    updates: Partial<IntegrationConfiguration>
  ): Promise<Integration> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error('Integration not found');
    }

    try {
      // Update configuration
      integration.configuration = {
        ...integration.configuration,
        ...updates,
      };
      integration.updatedAt = new Date();

      this.integrations.set(integrationId, integration);

      // Log update
      this.addLog(integrationId, 'info', 'Integration configuration updated', updates);

      // Re-test connection if enabled status changed
      if (updates.enabled !== undefined) {
        await this.testConnection(integrationId);
      }

      console.log(`Integration updated: ${integrationId}`);
      return integration;
    } catch (error) {
      console.error('Failed to update integration:', error);
      throw new Error(`Integration update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete integration
   */
  async deleteIntegration(integrationId: string): Promise<void> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error('Integration not found');
    }

    try {
      // Stop health monitoring
      const healthCheck = this.healthChecks.get(integrationId);
      if (healthCheck) {
        clearInterval(healthCheck);
        this.healthChecks.delete(integrationId);
      }

      // Remove credentials
      this.credentials.delete(integrationId);

      // Remove webhooks
      const webhooks = Array.from(this.webhooks.values()).filter(
        w => w.integrationId === integrationId
      );
      webhooks.forEach(w => this.webhooks.delete(w.id));

      // Remove logs
      this.logs.delete(integrationId);

      // Remove integration
      this.integrations.delete(integrationId);

      console.log(`Integration deleted: ${integrationId}`);
    } catch (error) {
      console.error('Failed to delete integration:', error);
      throw new Error(`Integration deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get integration by ID
   */
  getIntegration(integrationId: string): Integration | undefined {
    return this.integrations.get(integrationId);
  }

  /**
   * Get all integrations for a project
   */
  getProjectIntegrations(projectId: string): Integration[] {
    return Array.from(this.integrations.values()).filter(
      i => i.projectId === projectId
    );
  }

  /**
   * Get integrations by type
   */
  getIntegrationsByType(projectId: string, type: IntegrationType): Integration[] {
    return Array.from(this.integrations.values()).filter(
      i => i.projectId === projectId && i.type === type
    );
  }

  /**
   * Test integration connection
   */
  async testConnection(integrationId: string): Promise<IntegrationHealth> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error('Integration not found');
    }

    const startTime = Date.now();

    try {
      // Get decrypted credentials
      const credentials = this.getDecryptedCredentials(integrationId);

      // Perform connection test based on integration type
      const testResult = await this.performConnectionTest(
        integration,
        credentials
      );

      const responseTime = Date.now() - startTime;

      // Update health status
      integration.health = {
        status: testResult.success ? 'healthy' : 'unhealthy',
        lastCheck: new Date(),
        uptime: testResult.success ? 100 : 0,
        responseTime,
        errorRate: testResult.success ? 0 : 100,
        lastError: testResult.success ? null : testResult.error || null,
      };

      integration.status = testResult.success ? 'connected' : 'error';
      integration.updatedAt = new Date();

      this.integrations.set(integrationId, integration);

      // Log test result
      this.addLog(
        integrationId,
        testResult.success ? 'info' : 'error',
        `Connection test ${testResult.success ? 'successful' : 'failed'}`,
        { responseTime, error: testResult.error }
      );

      return integration.health;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      integration.health = {
        status: 'unhealthy',
        lastCheck: new Date(),
        uptime: 0,
        responseTime,
        errorRate: 100,
        lastError: error instanceof Error ? error.message : 'Unknown error',
      };

      integration.status = 'error';
      integration.updatedAt = new Date();

      this.integrations.set(integrationId, integration);

      this.addLog(integrationId, 'error', 'Connection test failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Get integration health status
   */
  getIntegrationHealth(integrationId: string): IntegrationHealth | undefined {
    const integration = this.integrations.get(integrationId);
    return integration?.health;
  }

  /**
   * Get integration metrics
   */
  getIntegrationMetrics(integrationId: string): IntegrationMetrics | undefined {
    const integration = this.integrations.get(integrationId);
    return integration?.metrics;
  }

  /**
   * Get integration logs
   */
  getIntegrationLogs(
    integrationId: string,
    limit: number = 100,
    level?: 'info' | 'warning' | 'error'
  ): IntegrationLog[] {
    const logs = this.logs.get(integrationId) || [];
    
    let filteredLogs = logs;
    if (level) {
      filteredLogs = logs.filter(log => log.level === level);
    }

    return filteredLogs.slice(-limit);
  }

  /**
   * Register webhook for integration
   */
  async registerWebhook(
    integrationId: string,
    url: string,
    events: string[],
    secret?: string
  ): Promise<IntegrationWebhook> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error('Integration not found');
    }

    const webhookId = uuidv4();
    const webhook: IntegrationWebhook = {
      id: webhookId,
      integrationId,
      url,
      events,
      secret: secret || this.generateWebhookSecret(),
      enabled: true,
      createdAt: new Date(),
      lastTriggered: null,
      deliveryCount: 0,
      failureCount: 0,
    };

    this.webhooks.set(webhookId, webhook);

    this.addLog(integrationId, 'info', 'Webhook registered', {
      url,
      events,
    });

    console.log(`Webhook registered for integration ${integrationId}`);
    return webhook;
  }

  /**
   * Trigger webhook
   */
  async triggerWebhook(
    integrationId: string,
    event: string,
    payload: any
  ): Promise<void> {
    const webhooks = Array.from(this.webhooks.values()).filter(
      w => w.integrationId === integrationId && 
           w.enabled && 
           w.events.includes(event)
    );

    for (const webhook of webhooks) {
      try {
        // Create signature for webhook security
        const signature = this.createWebhookSignature(payload, webhook.secret);

        // In production, this would make actual HTTP requests
        console.log(`Triggering webhook ${webhook.id} for event ${event}`);

        webhook.lastTriggered = new Date();
        webhook.deliveryCount++;
        this.webhooks.set(webhook.id, webhook);

        this.addLog(integrationId, 'info', `Webhook triggered: ${event}`, {
          webhookId: webhook.id,
          event,
        });
      } catch (error) {
        webhook.failureCount++;
        this.webhooks.set(webhook.id, webhook);

        this.addLog(integrationId, 'error', `Webhook delivery failed: ${event}`, {
          webhookId: webhook.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  /**
   * Create custom integration
   */
  async createCustomIntegration(
    projectId: string,
    name: string,
    description: string,
    template: IntegrationTemplate
  ): Promise<CustomIntegration> {
    const customId = uuidv4();
    
    const customIntegration: CustomIntegration = {
      id: customId,
      projectId,
      name,
      description,
      template,
      version: '1.0.0',
      author: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: false,
      usageCount: 0,
    };

    this.customIntegrations.set(customId, customIntegration);

    console.log(`Custom integration created: ${name} (${customId})`);
    return customIntegration;
  }

  /**
   * Get custom integration
   */
  getCustomIntegration(customId: string): CustomIntegration | undefined {
    return this.customIntegrations.get(customId);
  }

  /**
   * List custom integrations
   */
  listCustomIntegrations(projectId?: string): CustomIntegration[] {
    const integrations = Array.from(this.customIntegrations.values());
    
    if (projectId) {
      return integrations.filter(
        i => i.projectId === projectId || i.isPublic
      );
    }
    
    return integrations.filter(i => i.isPublic);
  }

  /**
   * Deploy custom integration
   */
  async deployCustomIntegration(
    customId: string,
    projectId: string,
    configuration: IntegrationConfiguration,
    credentials: IntegrationCredentials
  ): Promise<Integration> {
    const customIntegration = this.customIntegrations.get(customId);
    if (!customIntegration) {
      throw new Error('Custom integration not found');
    }

    // Register as a standard integration
    const integration = await this.registerIntegration(
      projectId,
      customIntegration.name,
      'custom',
      customIntegration.name,
      configuration,
      credentials
    );

    // Increment usage count
    customIntegration.usageCount++;
    this.customIntegrations.set(customId, customIntegration);

    return integration;
  }

  /**
   * Execute integration API call
   */
  async executeAPICall(
    integrationId: string,
    method: string,
    endpoint: string,
    data?: any
  ): Promise<any> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error('Integration not found');
    }

    if (!integration.configuration.enabled) {
      throw new Error('Integration is disabled');
    }

    const startTime = Date.now();

    try {
      // Get decrypted credentials
      const credentials = this.getDecryptedCredentials(integrationId);

      // Execute API call
      const result = await this.makeAPIRequest(
        integration,
        credentials,
        method,
        endpoint,
        data
      );

      const responseTime = Date.now() - startTime;

      // Update metrics
      integration.metrics.totalRequests++;
      integration.metrics.successfulRequests++;
      integration.metrics.averageResponseTime = 
        (integration.metrics.averageResponseTime * (integration.metrics.totalRequests - 1) + responseTime) / 
        integration.metrics.totalRequests;
      integration.metrics.lastActivity = new Date();

      this.integrations.set(integrationId, integration);

      // Log API call
      this.addLog(integrationId, 'info', `API call: ${method} ${endpoint}`, {
        responseTime,
        statusCode: result.statusCode,
      });

      return result.data;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Update metrics
      integration.metrics.totalRequests++;
      integration.metrics.failedRequests++;
      integration.metrics.lastActivity = new Date();

      // Update error rate
      integration.health.errorRate = 
        (integration.metrics.failedRequests / integration.metrics.totalRequests) * 100;

      this.integrations.set(integrationId, integration);

      // Log error
      this.addLog(integrationId, 'error', `API call failed: ${method} ${endpoint}`, {
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Batch execute API calls
   */
  async batchExecuteAPICalls(
    integrationId: string,
    calls: Array<{ method: string; endpoint: string; data?: any }>
  ): Promise<any[]> {
    const results: any[] = [];

    for (const call of calls) {
      try {
        const result = await this.executeAPICall(
          integrationId,
          call.method,
          call.endpoint,
          call.data
        );
        results.push({ success: true, data: result });
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Get integration statistics
   */
  getIntegrationStatistics(projectId: string): {
    total: number;
    byType: Record<IntegrationType, number>;
    byStatus: Record<IntegrationStatus, number>;
    healthyCount: number;
    unhealthyCount: number;
    totalRequests: number;
    averageResponseTime: number;
  } {
    const integrations = this.getProjectIntegrations(projectId);

    const stats = {
      total: integrations.length,
      byType: {} as Record<IntegrationType, number>,
      byStatus: {} as Record<IntegrationStatus, number>,
      healthyCount: 0,
      unhealthyCount: 0,
      totalRequests: 0,
      averageResponseTime: 0,
    };

    integrations.forEach(integration => {
      // Count by type
      stats.byType[integration.type] = (stats.byType[integration.type] || 0) + 1;

      // Count by status
      stats.byStatus[integration.status] = (stats.byStatus[integration.status] || 0) + 1;

      // Count health
      if (integration.health.status === 'healthy') {
        stats.healthyCount++;
      } else {
        stats.unhealthyCount++;
      }

      // Aggregate metrics
      stats.totalRequests += integration.metrics.totalRequests;
      stats.averageResponseTime += integration.metrics.averageResponseTime;
    });

    if (integrations.length > 0) {
      stats.averageResponseTime /= integrations.length;
    }

    return stats;
  }

  // Private helper methods

  private encryptCredentials(credentials: IntegrationCredentials): IntegrationCredentials {
    // In production, use proper encryption (AES-256-GCM)
    const encrypted = { ...credentials };
    
    if (credentials.apiKey) {
      encrypted.apiKey = this.encrypt(credentials.apiKey);
    }
    if (credentials.accessToken) {
      encrypted.accessToken = this.encrypt(credentials.accessToken);
    }
    if (credentials.refreshToken) {
      encrypted.refreshToken = this.encrypt(credentials.refreshToken);
    }
    if (credentials.password) {
      encrypted.password = this.encrypt(credentials.password);
    }
    if (credentials.privateKey) {
      encrypted.privateKey = this.encrypt(credentials.privateKey);
    }

    return encrypted;
  }

  private getDecryptedCredentials(integrationId: string): IntegrationCredentials {
    const encrypted = this.credentials.get(integrationId);
    if (!encrypted) {
      throw new Error('Credentials not found');
    }

    const decrypted = { ...encrypted };

    if (encrypted.apiKey) {
      decrypted.apiKey = this.decrypt(encrypted.apiKey);
    }
    if (encrypted.accessToken) {
      decrypted.accessToken = this.decrypt(encrypted.accessToken);
    }
    if (encrypted.refreshToken) {
      decrypted.refreshToken = this.decrypt(encrypted.refreshToken);
    }
    if (encrypted.password) {
      decrypted.password = this.decrypt(encrypted.password);
    }
    if (encrypted.privateKey) {
      decrypted.privateKey = this.decrypt(encrypted.privateKey);
    }

    return decrypted;
  }

  private encrypt(text: string): string {
    // Simple encryption for demo - use proper encryption in production
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private decrypt(encrypted: string): string {
    // Simple decryption for demo - use proper decryption in production
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private async performConnectionTest(
    integration: Integration,
    credentials: IntegrationCredentials
  ): Promise<{ success: boolean; error?: string }> {
    // Simulate connection test based on integration type
    // In production, this would make actual API calls to test connectivity

    try {
      // Mock successful connection test
      console.log(`Testing connection for ${integration.name}`);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100));

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async makeAPIRequest(
    integration: Integration,
    credentials: IntegrationCredentials,
    method: string,
    endpoint: string,
    data?: any
  ): Promise<{ statusCode: number; data: any }> {
    // Simulate API request
    // In production, this would make actual HTTP requests

    console.log(`API Request: ${method} ${endpoint}`);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50));

    return {
      statusCode: 200,
      data: { success: true, message: 'Mock API response' },
    };
  }

  private startHealthMonitoring(integration: Integration): void {
    // Check health every 5 minutes
    const healthCheck = setInterval(async () => {
      try {
        await this.testConnection(integration.id);
      } catch (error) {
        console.error(`Health check failed for integration ${integration.id}:`, error);
      }
    }, 5 * 60 * 1000);

    this.healthChecks.set(integration.id, healthCheck);
  }

  private addLog(
    integrationId: string,
    level: 'info' | 'warning' | 'error',
    message: string,
    metadata?: any
  ): void {
    const logs = this.logs.get(integrationId) || [];
    
    const log: IntegrationLog = {
      id: uuidv4(),
      integrationId,
      level,
      message,
      metadata,
      timestamp: new Date(),
    };

    logs.push(log);

    // Keep only last 1000 logs per integration
    if (logs.length > 1000) {
      logs.shift();
    }

    this.logs.set(integrationId, logs);
  }

  private generateWebhookSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private createWebhookSignature(payload: any, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }
}

// Export singleton instance
export const integrationHubService = new IntegrationHubService();
