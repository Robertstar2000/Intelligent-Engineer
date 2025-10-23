-- Migration: Create CAD Integration tables
-- Description: Tables for managing CAD software connections, file synchronization, and design data

-- CAD Connections table
CREATE TABLE IF NOT EXISTS cad_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    software_type VARCHAR(50) NOT NULL,
    software_name VARCHAR(255) NOT NULL,
    software_version VARCHAR(50),
    api_version VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'connected',
    api_endpoint TEXT,
    webhook_url TEXT,
    plugin_version VARCHAR(50),
    last_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CAD Credentials table (encrypted storage)
CREATE TABLE IF NOT EXISTS cad_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES cad_connections(id) ON DELETE CASCADE,
    credential_type VARCHAR(50) NOT NULL,
    api_key_encrypted TEXT,
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    username_encrypted TEXT,
    password_encrypted TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    scopes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CAD Sync Settings table
CREATE TABLE IF NOT EXISTS cad_sync_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES cad_connections(id) ON DELETE CASCADE,
    auto_sync BOOLEAN DEFAULT true,
    sync_interval INTEGER DEFAULT 30,
    sync_direction VARCHAR(50) DEFAULT 'bidirectional',
    conflict_resolution VARCHAR(50) DEFAULT 'manual',
    file_filters JSONB,
    exclude_patterns JSONB,
    version_control BOOLEAN DEFAULT true,
    notify_on_sync BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CAD Files table
CREATE TABLE IF NOT EXISTS cad_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES cad_connections(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    path TEXT NOT NULL,
    format VARCHAR(50) NOT NULL,
    size BIGINT,
    version VARCHAR(50),
    checksum VARCHAR(255),
    sync_status VARCHAR(50) DEFAULT 'synced',
    local_path TEXT,
    remote_path TEXT,
    last_modified TIMESTAMP WITH TIME ZONE,
    last_synced TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CAD File Metadata table
CREATE TABLE IF NOT EXISTS cad_file_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES cad_files(id) ON DELETE CASCADE,
    author VARCHAR(255),
    created_date TIMESTAMP WITH TIME ZONE,
    modified_date TIMESTAMP WITH TIME ZONE,
    part_number VARCHAR(255),
    revision VARCHAR(50),
    description TEXT,
    materials JSONB,
    dimensions JSONB,
    mass JSONB,
    custom_properties JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CAD Sync History table
CREATE TABLE IF NOT EXISTS cad_sync_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES cad_connections(id) ON DELETE CASCADE,
    sync_id UUID NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL,
    files_processed INTEGER DEFAULT 0,
    files_succeeded INTEGER DEFAULT 0,
    files_failed INTEGER DEFAULT 0,
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CAD Sync Conflicts table
CREATE TABLE IF NOT EXISTS cad_sync_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_history_id UUID NOT NULL REFERENCES cad_sync_history(id) ON DELETE CASCADE,
    file_id UUID REFERENCES cad_files(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    conflict_type VARCHAR(50) NOT NULL,
    platform_version VARCHAR(50),
    cad_version VARCHAR(50),
    platform_modified TIMESTAMP WITH TIME ZONE,
    cad_modified TIMESTAMP WITH TIME ZONE,
    resolution VARCHAR(50),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CAD Sync Errors table
CREATE TABLE IF NOT EXISTS cad_sync_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_history_id UUID NOT NULL REFERENCES cad_sync_history(id) ON DELETE CASCADE,
    file_id UUID REFERENCES cad_files(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    error_type VARCHAR(50) NOT NULL,
    error_message TEXT NOT NULL,
    error_code VARCHAR(50),
    retryable BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CAD Design Data table
CREATE TABLE IF NOT EXISTS cad_design_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES cad_files(id) ON DELETE CASCADE,
    extracted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    parts JSONB,
    assemblies JSONB,
    drawings JSONB,
    bom JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CAD Requirement Pushes table
CREATE TABLE IF NOT EXISTS cad_requirement_pushes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES cad_connections(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    requirements JSONB NOT NULL,
    target_files JSONB NOT NULL,
    push_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_cad_connections_project ON cad_connections(project_id);
CREATE INDEX idx_cad_connections_status ON cad_connections(status);
CREATE INDEX idx_cad_credentials_connection ON cad_credentials(connection_id);
CREATE INDEX idx_cad_sync_settings_connection ON cad_sync_settings(connection_id);
CREATE INDEX idx_cad_files_connection ON cad_files(connection_id);
CREATE INDEX idx_cad_files_sync_status ON cad_files(sync_status);
CREATE INDEX idx_cad_file_metadata_file ON cad_file_metadata(file_id);
CREATE INDEX idx_cad_sync_history_connection ON cad_sync_history(connection_id);
CREATE INDEX idx_cad_sync_history_status ON cad_sync_history(status);
CREATE INDEX idx_cad_sync_conflicts_sync ON cad_sync_conflicts(sync_history_id);
CREATE INDEX idx_cad_sync_conflicts_file ON cad_sync_conflicts(file_id);
CREATE INDEX idx_cad_sync_errors_sync ON cad_sync_errors(sync_history_id);
CREATE INDEX idx_cad_design_data_file ON cad_design_data(file_id);
CREATE INDEX idx_cad_requirement_pushes_connection ON cad_requirement_pushes(connection_id);
CREATE INDEX idx_cad_requirement_pushes_project ON cad_requirement_pushes(project_id);
CREATE INDEX idx_cad_requirement_pushes_status ON cad_requirement_pushes(status);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cad_connections_updated_at BEFORE UPDATE ON cad_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cad_credentials_updated_at BEFORE UPDATE ON cad_credentials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cad_sync_settings_updated_at BEFORE UPDATE ON cad_sync_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cad_files_updated_at BEFORE UPDATE ON cad_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cad_file_metadata_updated_at BEFORE UPDATE ON cad_file_metadata
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cad_design_data_updated_at BEFORE UPDATE ON cad_design_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE cad_connections IS 'Stores CAD software connection configurations';
COMMENT ON TABLE cad_credentials IS 'Stores encrypted credentials for CAD software authentication';
COMMENT ON TABLE cad_sync_settings IS 'Stores synchronization settings for each CAD connection';
COMMENT ON TABLE cad_files IS 'Tracks CAD files synchronized between platform and CAD software';
COMMENT ON TABLE cad_file_metadata IS 'Stores extracted metadata from CAD files';
COMMENT ON TABLE cad_sync_history IS 'Logs synchronization operations and their results';
COMMENT ON TABLE cad_sync_conflicts IS 'Tracks file conflicts during synchronization';
COMMENT ON TABLE cad_sync_errors IS 'Logs errors that occur during synchronization';
COMMENT ON TABLE cad_design_data IS 'Stores extracted design data from CAD files';
COMMENT ON TABLE cad_requirement_pushes IS 'Tracks requirement pushes to CAD software';
