import { Pool } from 'pg';
import {
  CADConnection,
  CADFile,
  CADSyncResult,
  CADSyncConflict,
  CADSyncError,
  CADDesignData,
  CADRequirementPush,
} from '@shared/types';

/**
 * Repository for CAD Integration data access
 */
export class CADRepository {
  constructor(private pool: Pool) {}

  /**
   * Save CAD connection to database
   */
  async saveConnection(connection: CADConnection): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Insert connection
      await client.query(
        `INSERT INTO cad_connections (
          id, project_id, software_type, software_name, software_version,
          api_version, status, api_endpoint, webhook_url, plugin_version, last_sync
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          last_sync = EXCLUDED.last_sync,
          updated_at = CURRENT_TIMESTAMP`,
        [
          connection.id,
          connection.projectId,
          connection.software.type,
          connection.software.name,
          connection.software.version,
          connection.software.apiVersion,
          connection.status,
          connection.configuration.apiEndpoint,
          connection.configuration.webhookUrl,
          connection.configuration.pluginVersion,
          connection.lastSync,
        ]
      );

      // Insert credentials (encrypted in production)
      await client.query(
        `INSERT INTO cad_credentials (
          connection_id, credential_type, api_key_encrypted, access_token_encrypted,
          refresh_token_encrypted, username_encrypted, password_encrypted, expires_at, scopes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (connection_id) DO UPDATE SET
          api_key_encrypted = EXCLUDED.api_key_encrypted,
          access_token_encrypted = EXCLUDED.access_token_encrypted,
          refresh_token_encrypted = EXCLUDED.refresh_token_encrypted,
          expires_at = EXCLUDED.expires_at,
          updated_at = CURRENT_TIMESTAMP`,
        [
          connection.id,
          connection.configuration.credentials.type,
          connection.configuration.credentials.apiKey,
          connection.configuration.credentials.accessToken,
          connection.configuration.credentials.refreshToken,
          connection.configuration.credentials.username,
          connection.configuration.credentials.password,
          connection.configuration.credentials.expiresAt,
          JSON.stringify(connection.configuration.credentials.scopes || []),
        ]
      );

      // Insert sync settings
      await client.query(
        `INSERT INTO cad_sync_settings (
          connection_id, auto_sync, sync_interval, sync_direction,
          conflict_resolution, file_filters, exclude_patterns,
          version_control, notify_on_sync
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (connection_id) DO UPDATE SET
          auto_sync = EXCLUDED.auto_sync,
          sync_interval = EXCLUDED.sync_interval,
          sync_direction = EXCLUDED.sync_direction,
          conflict_resolution = EXCLUDED.conflict_resolution,
          file_filters = EXCLUDED.file_filters,
          exclude_patterns = EXCLUDED.exclude_patterns,
          version_control = EXCLUDED.version_control,
          notify_on_sync = EXCLUDED.notify_on_sync,
          updated_at = CURRENT_TIMESTAMP`,
        [
          connection.id,
          connection.configuration.syncSettings.autoSync,
          connection.configuration.syncSettings.syncInterval,
          connection.configuration.syncSettings.syncDirection,
          connection.configuration.syncSettings.conflictResolution,
          JSON.stringify(connection.configuration.syncSettings.fileFilters),
          JSON.stringify(connection.configuration.syncSettings.excludePatterns),
          connection.configuration.syncSettings.versionControl,
          connection.configuration.syncSettings.notifyOnSync,
        ]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get CAD connection by ID
   */
  async getConnection(connectionId: string): Promise<CADConnection | null> {
    const result = await this.pool.query(
      `SELECT 
        c.*,
        cr.credential_type, cr.api_key_encrypted, cr.access_token_encrypted,
        cr.refresh_token_encrypted, cr.expires_at, cr.scopes,
        s.auto_sync, s.sync_interval, s.sync_direction, s.conflict_resolution,
        s.file_filters, s.exclude_patterns, s.version_control, s.notify_on_sync
      FROM cad_connections c
      LEFT JOIN cad_credentials cr ON c.id = cr.connection_id
      LEFT JOIN cad_sync_settings s ON c.id = s.connection_id
      WHERE c.id = $1`,
      [connectionId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToConnection(result.rows[0]);
  }

  /**
   * Get all connections for a project
   */
  async getProjectConnections(projectId: string): Promise<CADConnection[]> {
    const result = await this.pool.query(
      `SELECT 
        c.*,
        cr.credential_type, cr.api_key_encrypted, cr.access_token_encrypted,
        cr.refresh_token_encrypted, cr.expires_at, cr.scopes,
        s.auto_sync, s.sync_interval, s.sync_direction, s.conflict_resolution,
        s.file_filters, s.exclude_patterns, s.version_control, s.notify_on_sync
      FROM cad_connections c
      LEFT JOIN cad_credentials cr ON c.id = cr.connection_id
      LEFT JOIN cad_sync_settings s ON c.id = s.connection_id
      WHERE c.project_id = $1
      ORDER BY c.created_at DESC`,
      [projectId]
    );

    return result.rows.map(row => this.mapRowToConnection(row));
  }

  /**
   * Save CAD file
   */
  async saveFile(file: CADFile, connectionId: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO cad_files (
        id, connection_id, name, path, format, size, version, checksum,
        sync_status, local_path, remote_path, last_modified, last_synced
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (id) DO UPDATE SET
        sync_status = EXCLUDED.sync_status,
        last_modified = EXCLUDED.last_modified,
        last_synced = EXCLUDED.last_synced,
        updated_at = CURRENT_TIMESTAMP`,
      [
        file.id,
        connectionId,
        file.name,
        file.path,
        file.format,
        file.size,
        file.version,
        file.checksum,
        file.syncStatus,
        file.localPath,
        file.remotePath,
        file.lastModified,
        file.lastSynced,
      ]
    );

    // Save metadata if present
    if (file.metadata) {
      await this.pool.query(
        `INSERT INTO cad_file_metadata (
          file_id, author, created_date, modified_date, part_number,
          revision, description, materials, dimensions, mass, custom_properties
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (file_id) DO UPDATE SET
          author = EXCLUDED.author,
          modified_date = EXCLUDED.modified_date,
          part_number = EXCLUDED.part_number,
          revision = EXCLUDED.revision,
          description = EXCLUDED.description,
          materials = EXCLUDED.materials,
          dimensions = EXCLUDED.dimensions,
          mass = EXCLUDED.mass,
          custom_properties = EXCLUDED.custom_properties,
          updated_at = CURRENT_TIMESTAMP`,
        [
          file.id,
          file.metadata.author,
          file.metadata.createdDate,
          file.metadata.modifiedDate,
          file.metadata.partNumber,
          file.metadata.revision,
          file.metadata.description,
          JSON.stringify(file.metadata.materials || []),
          JSON.stringify(file.metadata.dimensions),
          JSON.stringify(file.metadata.mass),
          JSON.stringify(file.metadata.customProperties),
        ]
      );
    }
  }

  /**
   * Get files for a connection
   */
  async getConnectionFiles(connectionId: string): Promise<CADFile[]> {
    const result = await this.pool.query(
      `SELECT f.*, m.*
      FROM cad_files f
      LEFT JOIN cad_file_metadata m ON f.id = m.file_id
      WHERE f.connection_id = $1
      ORDER BY f.last_modified DESC`,
      [connectionId]
    );

    return result.rows.map(row => this.mapRowToFile(row));
  }

  /**
   * Save sync result
   */
  async saveSyncResult(result: CADSyncResult): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Insert sync history
      await client.query(
        `INSERT INTO cad_sync_history (
          sync_id, connection_id, start_time, end_time, status,
          files_processed, files_succeeded, files_failed, summary
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          result.syncId,
          result.connectionId,
          result.startTime,
          result.endTime,
          result.status,
          result.filesProcessed,
          result.filesSucceeded,
          result.filesFailed,
          result.summary,
        ]
      );

      // Insert conflicts
      for (const conflict of result.conflicts) {
        await client.query(
          `INSERT INTO cad_sync_conflicts (
            sync_history_id, file_id, file_name, conflict_type,
            platform_version, cad_version, platform_modified, cad_modified,
            resolution, resolved_at, resolved_by
          ) VALUES (
            (SELECT id FROM cad_sync_history WHERE sync_id = $1),
            $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
          )`,
          [
            result.syncId,
            conflict.fileId,
            conflict.fileName,
            conflict.conflictType,
            conflict.platformVersion,
            conflict.cadVersion,
            conflict.platformModified,
            conflict.cadModified,
            conflict.resolution,
            conflict.resolvedAt,
            conflict.resolvedBy,
          ]
        );
      }

      // Insert errors
      for (const error of result.errors) {
        await client.query(
          `INSERT INTO cad_sync_errors (
            sync_history_id, file_id, file_name, error_type,
            error_message, error_code, retryable
          ) VALUES (
            (SELECT id FROM cad_sync_history WHERE sync_id = $1),
            $2, $3, $4, $5, $6, $7
          )`,
          [
            result.syncId,
            error.fileId,
            error.fileName,
            error.errorType,
            error.errorMessage,
            error.errorCode,
            error.retryable,
          ]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Save design data
   */
  async saveDesignData(data: CADDesignData): Promise<void> {
    await this.pool.query(
      `INSERT INTO cad_design_data (
        file_id, extracted_at, parts, assemblies, drawings, bom
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (file_id) DO UPDATE SET
        extracted_at = EXCLUDED.extracted_at,
        parts = EXCLUDED.parts,
        assemblies = EXCLUDED.assemblies,
        drawings = EXCLUDED.drawings,
        bom = EXCLUDED.bom,
        updated_at = CURRENT_TIMESTAMP`,
      [
        data.fileId,
        data.extractedAt,
        JSON.stringify(data.parts),
        JSON.stringify(data.assemblies),
        JSON.stringify(data.drawings),
        JSON.stringify(data.bom),
      ]
    );
  }

  /**
   * Save requirement push
   */
  async saveRequirementPush(push: CADRequirementPush): Promise<void> {
    await this.pool.query(
      `INSERT INTO cad_requirement_pushes (
        id, connection_id, project_id, requirements, target_files,
        push_type, status, result, completed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        result = EXCLUDED.result,
        completed_at = EXCLUDED.completed_at`,
      [
        push.id,
        push.connectionId,
        push.projectId,
        JSON.stringify(push.requirements),
        JSON.stringify(push.targetFiles),
        push.pushType,
        push.status,
        JSON.stringify(push.result),
        push.completedAt,
      ]
    );
  }

  // Helper methods

  private mapRowToConnection(row: any): CADConnection {
    return {
      id: row.id,
      software: {
        type: row.software_type,
        name: row.software_name,
        version: row.software_version,
        apiVersion: row.api_version,
        capabilities: [],
        supportedFormats: [],
      },
      projectId: row.project_id,
      syncedFiles: [],
      lastSync: row.last_sync,
      status: row.status,
      configuration: {
        connectionId: row.id,
        software: {
          type: row.software_type,
          name: row.software_name,
          version: row.software_version,
          apiVersion: row.api_version,
          capabilities: [],
          supportedFormats: [],
        },
        credentials: {
          type: row.credential_type,
          apiKey: row.api_key_encrypted,
          accessToken: row.access_token_encrypted,
          refreshToken: row.refresh_token_encrypted,
          expiresAt: row.expires_at,
          scopes: row.scopes ? JSON.parse(row.scopes) : [],
        },
        syncSettings: {
          autoSync: row.auto_sync,
          syncInterval: row.sync_interval,
          syncDirection: row.sync_direction,
          conflictResolution: row.conflict_resolution,
          fileFilters: row.file_filters ? JSON.parse(row.file_filters) : [],
          excludePatterns: row.exclude_patterns ? JSON.parse(row.exclude_patterns) : [],
          versionControl: row.version_control,
          notifyOnSync: row.notify_on_sync,
        },
        apiEndpoint: row.api_endpoint,
        webhookUrl: row.webhook_url,
        pluginVersion: row.plugin_version,
      },
    };
  }

  private mapRowToFile(row: any): CADFile {
    return {
      id: row.id,
      name: row.name,
      path: row.path,
      format: row.format,
      size: row.size,
      version: row.version,
      checksum: row.checksum,
      metadata: {
        author: row.author,
        createdDate: row.created_date,
        modifiedDate: row.modified_date,
        partNumber: row.part_number,
        revision: row.revision,
        description: row.description,
        materials: row.materials ? JSON.parse(row.materials) : [],
        dimensions: row.dimensions ? JSON.parse(row.dimensions) : undefined,
        mass: row.mass ? JSON.parse(row.mass) : undefined,
        customProperties: row.custom_properties ? JSON.parse(row.custom_properties) : {},
      },
      syncStatus: row.sync_status,
      lastModified: row.last_modified,
      lastSynced: row.last_synced,
      localPath: row.local_path,
      remotePath: row.remote_path,
    };
  }
}
