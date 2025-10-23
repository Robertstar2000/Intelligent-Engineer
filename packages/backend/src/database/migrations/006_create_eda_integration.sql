-- Migration: Create EDA Integration tables
-- Description: Tables for managing EDA/schematic software connections, file synchronization, and design data

-- EDA Connections table
CREATE TABLE IF NOT EXISTS eda_connections (
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

-- EDA Credentials table (encrypted storage)
CREATE TABLE IF NOT EXISTS eda_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES eda_connections(id) ON DELETE CASCADE,
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

-- EDA Sync Settings table
CREATE TABLE IF NOT EXISTS eda_sync_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES eda_connections(id) ON DELETE CASCADE,
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

-- EDA Files table
CREATE TABLE IF NOT EXISTS eda_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES eda_connections(id) ON DELETE CASCADE,
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

-- EDA File Metadata table
CREATE TABLE IF NOT EXISTS eda_file_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES eda_files(id) ON DELETE CASCADE,
    author VARCHAR(255),
    created_date TIMESTAMP WITH TIME ZONE,
    modified_date TIMESTAMP WITH TIME ZONE,
    project_name VARCHAR(255),
    revision VARCHAR(50),
    description TEXT,
    schematic_type VARCHAR(50),
    board_layers INTEGER,
    custom_properties JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- EDA Sync History table
CREATE TABLE IF NOT EXISTS eda_sync_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES eda_connections(id) ON DELETE CASCADE,
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

-- EDA Sync Conflicts table
CREATE TABLE IF NOT EXISTS eda_sync_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_history_id UUID NOT NULL REFERENCES eda_sync_history(id) ON DELETE CASCADE,
    file_id UUID REFERENCES eda_files(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    conflict_type VARCHAR(50) NOT NULL,
    platform_version VARCHAR(50),
    eda_version VARCHAR(50),
    platform_modified TIMESTAMP WITH TIME ZONE,
    eda_modified TIMESTAMP WITH TIME ZONE,
    resolution VARCHAR(50),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- EDA Sync Errors table
CREATE TABLE IF NOT EXISTS eda_sync_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_history_id UUID NOT NULL REFERENCES eda_sync_history(id) ON DELETE CASCADE,
    file_id UUID REFERENCES eda_files(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    error_type VARCHAR(50) NOT NULL,
    error_message TEXT NOT NULL,
    error_code VARCHAR(50),
    retryable BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- EDA Design Data table
CREATE TABLE IF NOT EXISTS eda_design_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES eda_files(id) ON DELETE CASCADE,
    extracted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    schematic JSONB,
    pcb_layout JSONB,
    components JSONB,
    netlist JSONB,
    bom JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- EDA Requirement Pushes table
CREATE TABLE IF NOT EXISTS eda_requirement_pushes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES eda_connections(id) ON DELETE CASCADE,
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
CREATE INDEX idx_eda_connections_project ON eda_connections(project_id);
CREATE INDEX idx_eda_connections_status ON eda_connections(status);
CREATE INDEX idx_eda_credentials_connection ON eda_credentials(connection_id);
CREATE INDEX idx_eda_sync_settings_connection ON eda_sync_settings(connection_id);
CREATE INDEX idx_eda_files_connection ON eda_files(connection_id);
CREATE INDEX idx_eda_files_sync_status ON eda_files(sync_status);
CREATE INDEX idx_eda_file_metadata_file ON eda_file_metadata(file_id);
CREATE INDEX idx_eda_sync_history_connection ON eda_sync_history(connection_id);
CREATE INDEX idx_eda_sync_history_status ON eda_sync_history(status);
CREATE INDEX idx_eda_sync_conflicts_sync ON eda_sync_conflicts(sync_history_id);
CREATE INDEX idx_eda_sync_conflicts_file ON eda_sync_conflicts(file_id);
CREATE INDEX idx_eda_sync_errors_sync ON eda_sync_errors(sync_history_id);
CREATE INDEX idx_eda_design_data_file ON eda_design_data(file_id);
CREATE INDEX idx_eda_requirement_pushes_connection ON eda_requirement_pushes(connection_id);
CREATE INDEX idx_eda_requirement_pushes_project ON eda_requirement_pushes(project_id);
CREATE INDEX idx_eda_requirement_pushes_status ON eda_requirement_pushes(status);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_eda_connections_updated_at BEFORE UPDATE ON eda_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_eda_credentials_updated_at BEFORE UPDATE ON eda_credentials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_eda_sync_settings_updated_at BEFORE UPDATE ON eda_sync_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_eda_files_updated_at BEFORE UPDATE ON eda_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_eda_file_metadata_updated_at BEFORE UPDATE ON eda_file_metadata
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_eda_design_data_updated_at BEFORE UPDATE ON eda_design_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE eda_connections IS 'Stores EDA software connection configurations';
COMMENT ON TABLE eda_credentials IS 'Stores encrypted credentials for EDA software authentication';
COMMENT ON TABLE eda_sync_settings IS 'Stores synchronization settings for each EDA connection';
COMMENT ON TABLE eda_files IS 'Tracks EDA files synchronized between platform and EDA software';
COMMENT ON TABLE eda_file_metadata IS 'Stores extracted metadata from EDA files';
COMMENT ON TABLE eda_sync_history IS 'Logs synchronization operations and their results';
COMMENT ON TABLE eda_sync_conflicts IS 'Tracks file conflicts during synchronization';
COMMENT ON TABLE eda_sync_errors IS 'Logs errors that occur during synchronization';
COMMENT ON TABLE eda_design_data IS 'Stores extracted design data from EDA files (schematics, PCB, netlist, BOM)';
COMMENT ON TABLE eda_requirement_pushes IS 'Tracks requirement pushes to EDA software';
