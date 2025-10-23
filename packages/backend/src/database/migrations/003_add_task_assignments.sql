-- Add task assignments and notifications tables

-- Task assignments table
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
    instructions JSONB DEFAULT '{}',
    dependencies JSONB DEFAULT '[]',
    progress_notes JSONB DEFAULT '[]',
    due_date TIMESTAMP WITH TIME ZONE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Email notifications log
CREATE TABLE email_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    template_name VARCHAR(100),
    status VARCHAR(20) CHECK (status IN ('pending', 'sent', 'failed', 'bounced')) DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_task_assignments_project ON task_assignments(project_id);
CREATE INDEX idx_task_assignments_assignee ON task_assignments(assigned_to);
CREATE INDEX idx_task_assignments_status ON task_assignments(status);
CREATE INDEX idx_task_assignments_due_date ON task_assignments(due_date);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);

CREATE INDEX idx_email_notifications_status ON email_notifications(status);
CREATE INDEX idx_email_notifications_created ON email_notifications(created_at);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_task_assignments_updated_at 
    BEFORE UPDATE ON task_assignments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();