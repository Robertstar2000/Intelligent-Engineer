-- Add team invitations table for managing user invitations

CREATE TABLE team_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role JSONB NOT NULL,
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'declined', 'expired')) DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_team_invitations_project ON team_invitations(project_id);
CREATE INDEX idx_team_invitations_email ON team_invitations(email);
CREATE INDEX idx_team_invitations_status ON team_invitations(status);
CREATE INDEX idx_team_invitations_expires ON team_invitations(expires_at);

-- Trigger for updated_at timestamp
CREATE TRIGGER update_team_invitations_updated_at 
    BEFORE UPDATE ON team_invitations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();