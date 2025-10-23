import {
  BatchExportJob,
  ScheduledExport,
  ExportAnalytics,
  CustomExportFormat,
  ExportFormat,
  ExportOptions,
  ExportResult,
} from '@shared/types';
import { v4 as uuidv4 } from 'uuid';
import { exportService } from './ExportService';

/**
 * Advanced Export Service
 * Handles batch export processing, scheduled exports, export analytics,
 * and custom export format development
 */
export class AdvancedExportService {
  private batchJobs: Map<string, BatchExportJob> = new Map();
  private scheduledExports: Map<string, ScheduledExport> = new Map();
  private analytics: Map<string, ExportAnalytics> = new Map();
  private customFormats: Map<string, CustomExportFormat> = new Map();
  private scheduledTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Create batch export job
   */
  async createBatchJob(
    projectIds: string[],
    format: ExportFormat,
    options: ExportOptions,
    userId: string
  ): Promise<BatchExportJob> {
    const jobId = uuidv4();

    const job: BatchExportJob = {
      id: jobId,
      projectIds,
      format,
      options,
      userId,
      status: 'pending',
      progress: 0,
      results: [],
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
      error: null,
    };

    this.batchJobs.set(jobId, job);

    // Start processing in background
    this.processBatchJob(job);

    console.log(`Batch export job created: ${jobId}`);
    return job;
  }

  /**
   * Create scheduled export
   */
  async createScheduledExport(
    projectId: string,
    format: ExportFormat,
    schedule: string,
    options: ExportOptions,
    distribution: {
      emails?: string[];
      webhooks?: string[];
      storage?: string;
    },
    userId: string
  ): Promise<ScheduledExport> {
    const scheduleId = uuidv4();

    const scheduledExport: ScheduledExport = {
      id: scheduleId,
      projectId,
      format,
      schedule,
      options,
      distribution,
      userId,
      enabled: true,
      lastRun: null,
      nextRun: this.calculateNextRun(schedule),
      runCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.scheduledExports.set(scheduleId, scheduledExport);

    // Set up scheduled execution
    this.setupScheduledExport(scheduledExport);

    console.log(`Scheduled export created: ${scheduleId}`);
    return scheduledExport;
  }

  /**
   * Get export analytics
   */
  async getExportAnalytics(
    projectId?: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<ExportAnalytics> {
    const analyticsId = projectId || 'global';
    let analytics = this.analytics.get(analyticsId);

    if (!analytics) {
      analytics = this.calculateAnalytics(projectId, timeRange);
      this.analytics.set(analyticsId, analytics);
    }

    return analytics;
  }

  /**
   * Create custom export format
   */
  async createCustomFormat(
    name: string,
    description: string,
    configuration: any,
    userId: string
  ): Promise<CustomExportFormat> {
    const formatId = uuidv4();

    const customFormat: CustomExportFormat = {
      id: formatId,
      name,
      description,
      configuration,
      transformer: configuration.transformer || 'default',
      validator: configuration.validator || 'default',
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: false,
      usageCount: 0,
    };

    this.customFormats.set(formatId, customFormat);

    console.log(`Custom export format created: ${name} (${formatId})`);
    return customFormat;
  }

  /**
   * Get batch job
   */
  getBatchJob(jobId: string): BatchExportJob | undefined {
    return this.batchJobs.get(jobId);
  }

  /**
   * Get scheduled export
   */
  getScheduledExport(scheduleId: string): ScheduledExport | undefined {
    return this.scheduledExports.get(scheduleId);
  }

  /**
   * List scheduled exports
   */
  listScheduledExports(projectId?: string): ScheduledExport[] {
    const exports = Array.from(this.scheduledExports.values());

    if (projectId) {
      return exports.filter(e => e.projectId === projectId);
    }

    return exports;
  }

  /**
   * Update scheduled export
   */
  async updateScheduledExport(
    scheduleId: string,
    updates: Partial<ScheduledExport>
  ): Promise<ScheduledExport> {
    const scheduledExport = this.scheduledExports.get(scheduleId);
    if (!scheduledExport) {
      throw new Error('Scheduled export not found');
    }

    // Update fields
    Object.assign(scheduledExport, updates);
    scheduledExport.updatedAt = new Date();

    // Recalculate next run if schedule changed
    if (updates.schedule) {
      scheduledExport.nextRun = this.calculateNextRun(updates.schedule);
    }

    // Restart timer if enabled status changed
    if (updates.enabled !== undefined) {
      if (updates.enabled) {
        this.setupScheduledExport(scheduledExport);
      } else {
        this.stopScheduledExport(scheduleId);
      }
    }

    this.scheduledExports.set(scheduleId, scheduledExport);

    console.log(`Scheduled export updated: ${scheduleId}`);
    return scheduledExport;
  }

  /**
   * Delete scheduled export
   */
  async deleteScheduledExport(scheduleId: string): Promise<void> {
    this.stopScheduledExport(scheduleId);
    this.scheduledExports.delete(scheduleId);
    console.log(`Scheduled export deleted: ${scheduleId}`);
  }

  /**
   * Get custom format
   */
  getCustomFormat(formatId: string): CustomExportFormat | undefined {
    return this.customFormats.get(formatId);
  }

  /**
   * List custom formats
   */
  listCustomFormats(): CustomExportFormat[] {
    return Array.from(this.customFormats.values());
  }

  // Private helper methods

  private async processBatchJob(job: BatchExportJob): Promise<void> {
    try {
      job.status = 'processing';
      job.startedAt = new Date();
      this.batchJobs.set(job.id, job);

      const results: ExportResult[] = [];
      const totalProjects = job.projectIds.length;

      for (let i = 0; i < job.projectIds.length; i++) {
        const projectId = job.projectIds[i];

        try {
          const result = await exportService.exportProject(
            projectId,
            job.format,
            job.options,
            job.userId
          );
          results.push(result);

          // Update progress
          job.progress = ((i + 1) / totalProjects) * 100;
          this.batchJobs.set(job.id, job);
        } catch (error) {
          console.error(`Batch export failed for project ${projectId}:`, error);
          results.push({
            id: uuidv4(),
            projectId,
            format: job.format,
            status: 'failed',
            filePath: null,
            fileName: null,
            fileSize: 0,
            downloadUrl: null,
            createdAt: new Date(),
            expiresAt: null,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      job.status = 'completed';
      job.completedAt = new Date();
      job.results = results;
      job.progress = 100;

      this.batchJobs.set(job.id, job);

      console.log(`Batch export job completed: ${job.id}`);
    } catch (error) {
      job.status = 'failed';
      job.completedAt = new Date();
      job.error = error instanceof Error ? error.message : 'Unknown error';
      this.batchJobs.set(job.id, job);

      console.error('Batch export job failed:', error);
    }
  }

  private setupScheduledExport(scheduledExport: ScheduledExport): void {
    if (!scheduledExport.enabled) return;

    // Stop existing timer if any
    this.stopScheduledExport(scheduledExport.id);

    // Calculate time until next run
    const now = new Date();
    const nextRun = scheduledExport.nextRun;
    const delay = nextRun.getTime() - now.getTime();

    if (delay > 0) {
      const timer = setTimeout(async () => {
        await this.executeScheduledExport(scheduledExport);
      }, delay);

      this.scheduledTimers.set(scheduledExport.id, timer);
      console.log(`Scheduled export timer set: ${scheduledExport.id}`);
    }
  }

  private stopScheduledExport(scheduleId: string): void {
    const timer = this.scheduledTimers.get(scheduleId);
    if (timer) {
      clearTimeout(timer);
      this.scheduledTimers.delete(scheduleId);
      console.log(`Scheduled export timer stopped: ${scheduleId}`);
    }
  }

  private async executeScheduledExport(scheduledExport: ScheduledExport): Promise<void> {
    try {
      console.log(`Executing scheduled export: ${scheduledExport.id}`);

      // Export project
      const result = await exportService.exportProject(
        scheduledExport.projectId,
        scheduledExport.format,
        scheduledExport.options,
        scheduledExport.userId
      );

      // Distribute export
      await this.distributeExport(result, scheduledExport.distribution);

      // Update scheduled export
      scheduledExport.lastRun = new Date();
      scheduledExport.runCount++;
      scheduledExport.nextRun = this.calculateNextRun(scheduledExport.schedule);
      scheduledExport.updatedAt = new Date();

      this.scheduledExports.set(scheduledExport.id, scheduledExport);

      // Set up next run
      this.setupScheduledExport(scheduledExport);

      console.log(`Scheduled export executed successfully: ${scheduledExport.id}`);
    } catch (error) {
      console.error('Scheduled export execution failed:', error);
    }
  }

  private async distributeExport(
    result: ExportResult,
    distribution: ScheduledExport['distribution']
  ): Promise<void> {
    // Send to emails
    if (distribution.emails && distribution.emails.length > 0) {
      console.log(`Sending export to emails: ${distribution.emails.join(', ')}`);
      // In production, integrate with email service
    }

    // Send to webhooks
    if (distribution.webhooks && distribution.webhooks.length > 0) {
      console.log(`Sending export to webhooks: ${distribution.webhooks.join(', ')}`);
      // In production, make HTTP POST requests
    }

    // Upload to storage
    if (distribution.storage) {
      console.log(`Uploading export to storage: ${distribution.storage}`);
      // In production, integrate with cloud storage
    }
  }

  private calculateNextRun(schedule: string): Date {
    // Simplified schedule parsing
    // In production, use a proper cron parser
    const now = new Date();

    // Parse schedule (e.g., "daily", "weekly", "monthly", "0 2 * * *")
    if (schedule === 'daily') {
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (schedule === 'weekly') {
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (schedule === 'monthly') {
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    // Default to daily
    return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }

  private calculateAnalytics(
    projectId?: string,
    timeRange?: { start: Date; end: Date }
  ): ExportAnalytics {
    // Mock analytics calculation
    // In production, aggregate from actual export data

    return {
      projectId,
      period: timeRange || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      },
      totalExports: 150,
      exportsByFormat: {
        pdf: 60,
        word: 40,
        powerpoint: 25,
        markdown: 15,
        zip: 10,
      },
      exportsByUser: {
        'user-1': 50,
        'user-2': 40,
        'user-3': 30,
        'user-4': 20,
        'user-5': 10,
      },
      averageExportTime: 5000,
      totalDataExported: 1024 * 1024 * 500, // 500MB
      popularTemplates: [
        { templateId: 'executive-default', usageCount: 45 },
        { templateId: 'technical-default', usageCount: 35 },
        { templateId: 'client-default', usageCount: 25 },
      ],
      trends: [
        { date: new Date(), count: 10 },
        { date: new Date(Date.now() - 24 * 60 * 60 * 1000), count: 8 },
        { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), count: 12 },
      ],
    };
  }
}

// Export singleton instance
export const advancedExportService = new AdvancedExportService();
