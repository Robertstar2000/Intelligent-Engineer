export interface Message {
  id: number;
  sender: 'user' | 'team' | 'system';
  userName?: string;
  avatar?: string;
  text?: string;
  attachment?: {
      name: string;
      data: string; // base64
      type: string;
  };
  timestamp: string;
}

export interface Sprint {
  id:string;
  name: string;
  description: string;
  status: 'not-started' | 'in-progress' | 'completed';
  deliverables: string[];
  output?: string;
  dependencies?: string[];
  notes?: string;
  attachments?: {
    name: string;
    content: string; // base64 encoded
    mimeType: string;
  }[];
  selectedTool?: string;
  chatLog?: Message[];
  generatedDocId?: string;
}

export interface TuningSettings {
  [key: string]: number | string | boolean;
}

export interface DesignReviewChecklistItem {
    id: string;
    text: string;
    checked: boolean;
}

export interface Phase {
  id: string;
  name: string;
  description: string;
  status: 'not-started' | 'in-progress' | 'in-review' | 'completed';
  sprints: Sprint[];
  tuningSettings: TuningSettings;
  output?: string;
  isEditable: boolean;
  diagramUrl?: string;
  designReview?: {
    required: boolean;
    checklist: DesignReviewChecklistItem[];
  };
  chatLog?: Message[];
  reviewStartDate?: string;
  reviewEndDate?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

export interface Comment {
    id: string;
    userId: string;
    phaseId: string;
    text: string;
    createdAt: Date;
}

export interface Risk {
  id: string;
  title: string;
  category: 'Technical' | 'Schedule' | 'Budget' | 'Resource' | 'Operational' | 'Other';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  mitigation: string;
}

export interface Resource {
  id: string;
  name: string;
  source: string;
  category: 'Software' | 'Equipment' | 'Other';
  justification: string;
}

export interface AnalyticsMetrics {
    completionRate: number;
    sprintCompletionRate: number;
    totalSprints: number;
    completedSprints: number;
    timeElapsedDays: number;
    currentPhaseName: string;
    phaseStatusCounts: {
        [key in Phase['status']]: number;
    };
    industryBenchmarks: {
        sprintVelocity: { value: number; benchmark: number }; // sprints per week
        designReviewEfficiency: { value: number; benchmark: number }; // days
    };
}

export interface Recommendation {
    id: string;
    title: string;
    category: 'Methodology' | 'Process' | 'Tools' | 'Risk Mitigation';
    description: string;
    actionableStep: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  assigneeId: string | null;
  phaseId: string;
  sprintId?: string;
  createdAt: Date;
  priority?: 'Low' | 'Medium' | 'High';
  dueDate?: string;
}

export interface MetaDocument {
  id: string;
  name: string;
  content: string;
  type: 'executive-summary' | 'code-vibe-prompt' | 'simulation-vibe-prompt' | 'diagram' | 'wireframe' | 'schematic' | 'risk-assessment-log' | 'resource-analysis-log' | 'pwb-layout-svg' | '3d-image-veo' | '2d-image' | '3d-printing-file' | 'software-code';
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  userId: string;
  requirements: string;
  constraints: string;
  disciplines: string[];
  developmentMode: 'full' | 'rapid';
  automationMode: 'hmap' | 'automated';
  currentPhase: number;
  phases: Phase[];
  createdAt: Date;
  users: User[];
  comments: {
    [phaseId: string]: Comment[];
  };
  risks?: Risk[];
  resources?: Resource[];
  analytics?: AnalyticsMetrics;
  recommendations?: Recommendation[];
  tasks?: Task[];
  compactedContext?: string;
  metaDocuments?: MetaDocument[];
}

export interface ToastMessage {
    message: string;
    type: 'success' | 'error' | 'info';
}