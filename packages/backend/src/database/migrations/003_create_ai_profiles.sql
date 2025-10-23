-- Migration: Create AI Profiles table
-- This table stores saved AI tuning configurations for reuse

CREATE TABLE IF NOT EXISTS ai_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tuning_settings JSONB NOT NULL,
    model_configuration JSONB NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    is_built_in BOOLEAN DEFAULT FALSE,
    is_shared BOOLEAN DEFAULT FALSE,
    usage_data JSONB NOT NULL DEFAULT '{"timesUsed": 0, "lastUsed": null, "averageRating": 0, "feedback": []}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_ai_profiles_user_id ON ai_profiles(user_id);
CREATE INDEX idx_ai_profiles_organization_id ON ai_profiles(organization_id);
CREATE INDEX idx_ai_profiles_is_built_in ON ai_profiles(is_built_in);
CREATE INDEX idx_ai_profiles_is_shared ON ai_profiles(is_shared);
CREATE INDEX idx_ai_profiles_name ON ai_profiles(name);

-- Unique constraint for built-in profiles
CREATE UNIQUE INDEX idx_ai_profiles_built_in_name ON ai_profiles(name) WHERE is_built_in = true;

-- Comments
COMMENT ON TABLE ai_profiles IS 'Stores AI tuning profiles for reuse across projects';
COMMENT ON COLUMN ai_profiles.tuning_settings IS 'JSON object containing AI tuning parameters';
COMMENT ON COLUMN ai_profiles.model_configuration IS 'JSON object containing model-specific configuration';
COMMENT ON COLUMN ai_profiles.usage_data IS 'JSON object tracking profile usage statistics';
COMMENT ON COLUMN ai_profiles.is_built_in IS 'True for system-provided profiles';
COMMENT ON COLUMN ai_profiles.is_shared IS 'True if profile is shared within organization';