-- Migration: 001_initial_schema
-- Description: Create initial database schema for Intelligent Engineering Platform 2.0
-- Date: 2025-01-01

-- This migration creates the complete database schema
-- Run the main schema file
\i ../schema.sql

-- Insert default data
INSERT INTO organizations (id, name, industry, size) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Default Organization', 'Engineering', 'medium');

-- Insert built-in templates
INSERT INTO templates (
    id, 
    name, 
    description, 
    disciplines, 
    development_mode, 
    phases,
    is_built_in,
    is_custom,
    organization_id
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Standard Engineering Project',
    'Default 7-phase engineering project template',
    '["Mechanical Engineering", "Electrical Engineering", "Software Engineering"]',
    'full',
    '[
        {
            "id": "1",
            "name": "Requirements",
            "description": "Define clear functional and performance objectives",
            "sprints": [
                {
                    "id": "1-1",
                    "name": "Project Scope",
                    "description": "A high-level document outlining the project''s purpose, objectives, and deliverables.",
                    "deliverables": []
                },
                {
                    "id": "1-2",
                    "name": "Statement of Work (SOW)",
                    "description": "A formal document detailing the work activities, deliverables, and timeline.",
                    "deliverables": []
                },
                {
                    "id": "1-3",
                    "name": "Technical Requirements Specification",
                    "description": "A detailed specification of the technical requirements, including performance, reliability, and safety.",
                    "deliverables": []
                }
            ],
            "tuningSettings": {
                "clarity": 70,
                "technicality": 60,
                "foresight": 50,
                "riskAversion": 60,
                "userCentricity": 75,
                "conciseness": 40
            },
            "designReview": {
                "required": false,
                "checklist": []
            }
        },
        {
            "id": "2",
            "name": "Preliminary Design",
            "description": "Create and compare initial concepts via trade studies",
            "sprints": [
                {
                    "id": "2-1",
                    "name": "Conceptual Design Options",
                    "description": "Generate several distinct high-level design concepts to address the project requirements.",
                    "deliverables": []
                },
                {
                    "id": "2-2",
                    "name": "Trade Study Analysis",
                    "description": "Conduct a formal trade study to compare the generated concepts against weighted criteria and select the optimal path forward.",
                    "deliverables": []
                }
            ],
            "tuningSettings": {
                "creativity": 80,
                "costOptimization": 50,
                "performanceBias": 70,
                "modularity": 60
            },
            "designReview": {
                "required": true,
                "checklist": []
            }
        },
        {
            "id": "3",
            "name": "Critical Design",
            "description": "Develop a detailed, comprehensive design specification and implementation sprints",
            "sprints": [],
            "tuningSettings": {
                "technicalDepth": 90,
                "failureAnalysis": 70,
                "manufacturability": 60,
                "standardsAdherence": 85
            },
            "designReview": {
                "required": true,
                "checklist": []
            }
        },
        {
            "id": "4",
            "name": "Testing",
            "description": "Develop formal Verification and Validation plans",
            "sprints": [
                {
                    "id": "4-1",
                    "name": "Verification Plan",
                    "description": "Define tests to confirm the system is built correctly to specifications.",
                    "deliverables": []
                },
                {
                    "id": "4-2",
                    "name": "Validation Plan",
                    "description": "Define tests to confirm the system meets user needs and requirements.",
                    "deliverables": []
                }
            ],
            "tuningSettings": {
                "coverage": 90,
                "edgeCaseFocus": 75,
                "automationPriority": 80,
                "destructiveTesting": 40
            },
            "designReview": {
                "required": false,
                "checklist": []
            }
        },
        {
            "id": "5",
            "name": "Launch",
            "description": "Formulate a detailed launch and deployment strategy",
            "sprints": [],
            "tuningSettings": {
                "phasedRollout": 70,
                "rollbackPlan": 90,
                "marketingCoordination": 50,
                "userTraining": 60
            },
            "designReview": {
                "required": false,
                "checklist": []
            }
        },
        {
            "id": "6",
            "name": "Operation",
            "description": "Create an operations and maintenance manual",
            "sprints": [],
            "tuningSettings": {
                "monitoring": 90,
                "preventativeMaintenance": 80,
                "supportProtocol": 70,
                "incidentResponse": 85
            },
            "designReview": {
                "required": false,
                "checklist": []
            }
        },
        {
            "id": "7",
            "name": "Improvement",
            "description": "Identify and prioritize future improvements",
            "sprints": [],
            "tuningSettings": {
                "userFeedback": 80,
                "performanceAnalysis": 90,
                "featureRoadmap": 70,
                "competitiveLandscape": 60
            },
            "designReview": {
                "required": false,
                "checklist": []
            }
        }
    ]',
    true,
    false,
    null
);

-- Insert default AI profiles
INSERT INTO ai_profiles (
    id,
    name,
    description,
    tuning_settings,
    model_configuration,
    organization_id,
    is_public
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Balanced Engineering',
    'Well-balanced settings for general engineering projects',
    '{
        "clarity": 70,
        "technicality": 60,
        "foresight": 50,
        "riskAversion": 60,
        "userCentricity": 75,
        "conciseness": 40
    }',
    '{
        "model": "gemini-pro",
        "temperature": 0.7,
        "maxTokens": 4000
    }',
    null,
    true
),
(
    '00000000-0000-0000-0000-000000000002',
    'High-Tech Precision',
    'High technicality and precision for complex engineering systems',
    '{
        "clarity": 85,
        "technicality": 90,
        "foresight": 80,
        "riskAversion": 85,
        "userCentricity": 60,
        "conciseness": 30
    }',
    '{
        "model": "gemini-pro",
        "temperature": 0.3,
        "maxTokens": 6000
    }',
    null,
    true
),
(
    '00000000-0000-0000-0000-000000000003',
    'Rapid Prototyping',
    'Quick and concise outputs for rapid development cycles',
    '{
        "clarity": 60,
        "technicality": 40,
        "foresight": 30,
        "riskAversion": 30,
        "userCentricity": 80,
        "conciseness": 90
    }',
    '{
        "model": "gemini-pro",
        "temperature": 0.8,
        "maxTokens": 2000
    }',
    null,
    true
);