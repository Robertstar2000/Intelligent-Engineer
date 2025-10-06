export interface Sprint {
  id:string;
  name: string;
  description: string;
  status: 'not-started' | 'in-progress' | 'completed';
  deliverables: string[];
  output?: string;
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
  designReview?: {
    required: boolean;
    checklist: DesignReviewChecklistItem[];
  };
}

export interface Project {
  id: string;
  name: string;
  requirements: string;
  constraints: string;
  disciplines: string[];
  developmentMode: 'full' | 'rapid';
  currentPhase: number;
  phases: Phase[];
  createdAt: Date;
}

export interface ToastMessage {
    message: string;
    type: 'success' | 'error';
}
