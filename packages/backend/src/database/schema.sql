-- Intelligent Engineering Platform 2.0 Database Schema
-- PostgreSQL schema with migration from localStorage data model

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    size VARCHAR(20) CHECK (size IN ('startup', 'small', 'medium', 'large', 'enterprise')),
    compliance_requirements JSONB DEFAULT '[]',
    custom_terminology JSONB DEFAULT '{}',
    branding JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Templates table
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(50) DEFAULT '1.0.0',
    disciplines JSONB NOT NULL DEFAULT '[]',
    development_mode VARCHAR(20) CHECK (development_mode IN ('full', 'rapid')) DEFAULT 'full',
    phases JSONB NOT NULL DEFAULT '[]',
    dynamic_roles JSONB DEFAULT '[]',
    compliance_frameworks JSONB DEFAULT '[]',
    ai_profiles JSONB DEFAULT '[]',
    integration_requirements JSONB DEFAULT '[]',
    is_built_in BOOLEAN DEFAULT false,
    is_custom BOOLEAN DEFAULT true,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    usage_stats JSONB DEFAULT '{"timesUsed": 0, "averageRating": 0, "feedback": []}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table (enhanced from existing localStorage model)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    requirements TEXT NOT NULL,
    constraints TEXT NOT NULL,
    disciplines JSONB NOT NULL DEFAULT '[]',
    development_mode VARCHAR(20) CHECK (development_mode IN ('full', 'rapid')) DEFAULT 'full',
    current_phase INTEGER DEFAULT 0,
    program_scale VARCHAR(20) CHECK (program_scale IN ('small', 'medium', 'large', 'enterprise')) DEFAULT 'medium',
    status VARCHAR(20) CHECK (status IN ('draft', 'active', 'on-hold', 'completed', 'archived')) DEFAULT 'draft',
    
    -- Relationships
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    program_leader UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Enhanced data
    phases JSONB NOT NULL DEFAULT '[]',
    team JSONB DEFAULT '[]',
    dynamic_roles JSONB DEFAULT '[]',
    compliance_requirements JSONB DEFAULT '[]',
    integrations JSONB DEFAULT '[]',
    analytics JSONB DEFAULT '{}',
    risk_assessment JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project team members
CREATE TABLE project_team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role JSONB NOT NULL,
    permissions JSONB DEFAULT '[]',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(project_id, user_id)
);

-- Collaboration sessions
CREATE TABLE collaboration_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    document_id VARCHAR(255) NOT NULL,
    session_type VARCHAR(50) CHECK (session_type IN ('document', 'whiteboard', '3d-model', 'video-call')),
    active_users JSONB DEFAULT '[]',
    invited_users JSONB DEFAULT '[]',
    permissions JSONB DEFAULT '[]',
    document_content JSONB DEFAULT '{}',
    changes JSONB DEFAULT '[]',
    conflicts JSONB DEFAULT '[]',
    cursors JSONB DEFAULT '[]',
    selections JSONB DEFAULT '[]',
    annotations JSONB DEFAULT '[]',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    max_participants INTEGER DEFAULT 10,
    recording_enabled BOOLEAN DEFAULT false,
    change_history JSONB DEFAULT '[]',
    snapshots JSONB DEFAULT '[]'
);

-- Audit trail
CREATE TABLE audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID NOT NULL,
    changes JSONB DEFAULT '[]',
    signature JSONB DEFAULT '{}',
    context JSONB DEFAULT '{}',
    
    -- Index for efficient querying
    INDEX idx_audit_timestamp (timestamp),
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_resource (resource_type, resource_id)
);

-- Integrations
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('cad', 'simulation', 'project-management', 'communication', 'version-control')),
    provider VARCHAR(100) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('connected', 'disconnected', 'error', 'syncing')) DEFAULT 'disconnected',
    configuration JSONB DEFAULT '{}',
    credentials JSONB DEFAULT '{}', -- Encrypted
    last_sync TIMESTAMP WITH TIME ZONE,
    sync_log JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CAD connections
CREATE TABLE cad_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    software JSONB NOT NULL,
    synced_files JSONB DEFAULT '[]',
    file_mappings JSONB DEFAULT '{}',
    sync_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Simulation connections
CREATE TABLE simulation_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    software JSONB NOT NULL,
    jobs JSONB DEFAULT '[]',
    results JSONB DEFAULT '[]',
    parameters JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Version control
CREATE TABLE version_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    resource_type VARCHAR(100) NOT NULL, -- 'project', 'phase', 'document', etc.
    resource_id VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    parent_version VARCHAR(50),
    changes JSONB NOT NULL DEFAULT '[]',
    message TEXT,
    tags JSONB DEFAULT '[]',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(project_id, resource_type, resource_id, version)
);

-- AI profiles
CREATE TABLE ai_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tuning_settings JSONB NOT NULL DEFAULT '{}',
    model_configuration JSONB DEFAULT '{}',
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance tracking
CREATE TABLE compliance_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    standard VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applicable_sections JSONB DEFAULT '[]',
    status VARCHAR(20) CHECK (status IN ('pending', 'in-progress', 'compliant', 'non-compliant')) DEFAULT 'pending',
    assessment_data JSONB DEFAULT '{}',
    last_assessed TIMESTAMP WITH TIME ZONE,
    next_assessment TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Risk assessments
CREATE TABLE risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    overall_risk_score DECIMAL(5,2) NOT NULL,
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    risks JSONB NOT NULL DEFAULT '[]',
    mitigation_plans JSONB DEFAULT '[]',
    future_risks JSONB DEFAULT '[]',
    trend_analysis JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    best_practices JSONB DEFAULT '[]',
    confidence DECIMAL(5,2) DEFAULT 0.0,
    model_version VARCHAR(50),
    data_quality JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_projects_organization ON projects(organization_id);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at);

CREATE INDEX idx_team_members_project ON project_team_members(project_id);
CREATE INDEX idx_team_members_user ON project_team_members(user_id);
CREATE INDEX idx_team_members_active ON project_team_members(is_active);

CREATE INDEX idx_collaboration_project ON collaboration_sessions(project_id);
CREATE INDEX idx_collaboration_active ON collaboration_sessions(is_active);
CREATE INDEX idx_collaboration_last_activity ON collaboration_sessions(last_activity);

CREATE INDEX idx_integrations_project ON integrations(project_id);
CREATE INDEX idx_integrations_type ON integrations(type);
CREATE INDEX idx_integrations_status ON integrations(status);

CREATE INDEX idx_version_history_project ON version_history(project_id);
CREATE INDEX idx_version_history_resource ON version_history(resource_type, resource_id);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_profiles_updated_at BEFORE UPDATE ON ai_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compliance_requirements_updated_at BEFORE UPDATE ON compliance_requirements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_risk_assessments_updated_at BEFORE UPDATE ON risk_assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Tas
k assignments and notifications
CREATE TABLE task_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    phase_id VARCHAR(255) NOT NULL,
    sprint_id VARCHAR(255) NOT NULL,
    assigned_to UUID REFERENCES users(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_role JSONB NOT NULL,
    status VARCHAR(20) CHECK (status IN ('assigned', 'in-progress', 'blocked', 'completed', 'cancelled')) DEFAULT 'assigned',
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    estimated_hours INTEGER DEFAULT 0,
    actual_hours INTEGER DEFAULT 0,
    instructions JSONB NOT NULL DEFAULT '{}',
    dependencies JSONB DEFAULT '[]',
    due_date TIMESTAMP WITH TIME ZONE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Task instructions (AI-generated)
CREATE TABLE task_instructions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES task_assignments(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    methodology TEXT,
    acceptance_criteria JSONB DEFAULT '[]',
    resources JSONB DEFAULT '[]',
    risks JSONB DEFAULT '[]',
    checkpoints JSONB DEFAULT '[]',
    estimated_timeline VARCHAR(255),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    generated_by VARCHAR(20) CHECK (generated_by IN ('ai', 'manual', 'fallback')) DEFAULT 'ai',
    confidence DECIMAL(5,2) DEFAULT 0.0
);

-- Task dependencies
CREATE TABLE task_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dependent_task_id UUID REFERENCES task_assignments(id) ON DELETE CASCADE,
    depends_on_task_id UUID REFERENCES task_assignments(id) ON DELETE CASCADE,
    dependency_type VARCHAR(20) CHECK (dependency_type IN ('finish-to-start', 'start-to-start', 'finish-to-finish', 'start-to-finish')) DEFAULT 'finish-to-start',
    is_blocking BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(dependent_task_id, depends_on_task_id)
);

-- Progress notes
CREATE TABLE progress_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES task_assignments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    hours_worked INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team invitations
CREATE TABLE team_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role JSONB NOT NULL,
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'declined', 'expired')) DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification templates
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    subject VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    type VARCHAR(20) CHECK (type IN ('email', 'in-app', 'push')) DEFAULT 'email',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email notifications
CREATE TABLE email_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    template_name VARCHAR(255),
    status VARCHAR(20) CHECK (status IN ('pending', 'sent', 'failed', 'bounced')) DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Additional indexes for task management
CREATE INDEX idx_task_assignments_project ON task_assignments(project_id);
CREATE INDEX idx_task_assignments_assigned_to ON task_assignments(assigned_to);
CREATE INDEX idx_task_assignments_status ON task_assignments(status);
CREATE INDEX idx_task_assignments_due_date ON task_assignments(due_date);

CREATE INDEX idx_task_instructions_task ON task_instructions(task_id);
CREATE INDEX idx_task_dependencies_dependent ON task_dependencies(dependent_task_id);
CREATE INDEX idx_task_dependencies_depends_on ON task_dependencies(depends_on_task_id);

CREATE INDEX idx_progress_notes_task ON progress_notes(task_id);
CREATE INDEX idx_progress_notes_user ON progress_notes(user_id);

CREATE INDEX idx_team_invitations_project ON team_invitations(project_id);
CREATE INDEX idx_team_invitations_email ON team_invitations(email);
CREATE INDEX idx_team_invitations_status ON team_invitations(status);

CREATE INDEX idx_email_notifications_status ON email_notifications(status);
CREATE INDEX idx_email_notifications_created_at ON email_notifications(created_at);

-- Additional triggers
CREATE TRIGGER update_task_assignments_updated_at BEFORE UPDATE ON task_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Generated reports
CREATE TABLE generated_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    report_type VARCHAR(50) CHECK (report_type IN ('executive', 'technical', 'performance', 'risk')) NOT NULL,
    title VARCHAR(500) NOT NULL,
    summary TEXT NOT NULL,
    sections JSONB DEFAULT '[]',
    insights JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    risk_alerts JSONB DEFAULT '[]',
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    generated_by VARCHAR(20) CHECK (generated_by IN ('ai', 'manual')) DEFAULT 'ai'
);

-- Report schedules
CREATE TABLE report_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    report_type VARCHAR(50) CHECK (report_type IN ('executive', 'technical', 'performance', 'risk')) NOT NULL,
    recipients JSONB DEFAULT '[]',
    schedule VARCHAR(20) CHECK (schedule IN ('daily', 'weekly', 'monthly', 'on-demand')) NOT NULL,
    include_risk_analysis BOOLEAN DEFAULT false,
    include_recommendations BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_generated TIMESTAMP WITH TIME ZONE,
    next_generation TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for reports
CREATE INDEX idx_generated_reports_project ON generated_reports(project_id);
CREATE INDEX idx_generated_reports_type ON generated_reports(report_type);
CREATE INDEX idx_generated_reports_generated_at ON generated_reports(generated_at);

CREATE INDEX idx_report_schedules_project ON report_schedules(project_id);
CREATE INDEX idx_report_schedules_active ON report_schedules(is_active);
CREATE INDEX idx_report_schedules_next_generation ON report_schedules(next_generation);

-- Triggers for report schedules
CREATE TRIGGER update_report_schedules_updated_at BEFORE UPDATE ON report_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Compliance reports
CREATE TABLE compliance_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    report_type VARCHAR(50) CHECK (report_type IN ('status', 'gap-analysis', 'audit-ready', 'submission')) NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    overall_status VARCHAR(20) CHECK (overall_status IN ('compliant', 'non-compliant', 'in-progress')) NOT NULL,
    compliance_score DECIMAL(5,2) DEFAULT 0.0,
    frameworks JSONB DEFAULT '[]',
    gaps JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]'
);

-- Indexes for compliance
CREATE INDEX idx_compliance_reports_project ON compliance_reports(project_id);
CREATE INDEX idx_compliance_reports_generated_at ON compliance_reports(generated_at);
CREATE INDEX idx_compliance_requirements_project ON compliance_requirements(project_id);
CREATE INDEX idx_compliance_requirements_status ON compliance_requirements(status);


-- Change control requests
CREATE TABLE change_control_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
    change_type VARCHAR(50) CHECK (change_type IN ('phase', 'sprint', 'document', 'team', 'settings')) NOT NULL,
    description TEXT NOT NULL,
    justification TEXT NOT NULL,
    impact_assessment TEXT NOT NULL,
    proposed_changes JSONB NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected', 'implemented')) DEFAULT 'pending',
    approvers JSONB DEFAULT '[]',
    approvals JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for change control
CREATE INDEX idx_change_control_project ON change_control_requests(project_id);
CREATE INDEX idx_change_control_status ON change_control_requests(status);
CREATE INDEX idx_change_control_requested_by ON change_control_requests(requested_by);

-- Trigger for change control
CREATE TRIGGER update_change_control_updated_at BEFORE UPDATE ON change_control_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
