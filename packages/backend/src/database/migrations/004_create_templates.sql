-- Migration: Create Templates table
-- This table stores project templates with dynamic roles and AI profiles

CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(50) NOT NULL DEFAULT '1.0',
    disciplines JSONB NOT NULL,
    development_mode VARCHAR(20) NOT NULL CHECK (development_mode IN ('full', 'rapid')),
    phases JSONB NOT NULL,
    dynamic_roles JSONB NOT NULL DEFAULT '[]',
    compliance_frameworks JSONB NOT NULL DEFAULT '[]',
    ai_profiles JSONB NOT NULL DEFAULT '[]',
    integration_requirements JSONB NOT NULL DEFAULT '[]',
    is_built_in BOOLEAN DEFAULT FALSE,
    is_custom BOOLEAN DEFAULT TRUE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    usage_data JSONB NOT NULL DEFAULT '{"timesUsed": 0, "lastUsed": null, "averageRating": 0, "feedback": []}',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_templates_name ON templates(name);
CREATE INDEX idx_templates_disciplines ON templates USING GIN(disciplines);
CREATE INDEX idx_templates_development_mode ON templates(development_mode);
CREATE INDEX idx_templates_is_built_in ON templates(is_built_in);
CREATE INDEX idx_templates_is_custom ON templates(is_custom);
CREATE INDEX idx_templates_organization_id ON templates(organization_id);
CREATE INDEX idx_templates_created_by ON templates(created_by);
CREATE INDEX idx_templates_usage_times_used ON templates(((usage_data->>'timesUsed')::int));

-- Full-text search index
CREATE INDEX idx_templates_search ON templates USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Unique constraint for built-in templates
CREATE UNIQUE INDEX idx_templates_built_in_name ON templates(name) WHERE is_built_in = true;

-- Comments
COMMENT ON TABLE templates IS 'Stores project templates with dynamic roles and configurations';
COMMENT ON COLUMN templates.disciplines IS 'JSON array of engineering disciplines';
COMMENT ON COLUMN templates.phases IS 'JSON array of phase templates with sprints and configurations';
COMMENT ON COLUMN templates.dynamic_roles IS 'JSON array of dynamically generated roles';
COMMENT ON COLUMN templates.compliance_frameworks IS 'JSON array of applicable compliance frameworks';
COMMENT ON COLUMN templates.ai_profiles IS 'JSON array of AI tuning profiles for this template';
COMMENT ON COLUMN templates.integration_requirements IS 'JSON array of required integrations';
COMMENT ON COLUMN templates.usage_data IS 'JSON object tracking template usage statistics';
COMMENT ON COLUMN templates.is_built_in IS 'True for system-provided templates';
COMMENT ON COLUMN templates.is_custom IS 'True for user-created templates';