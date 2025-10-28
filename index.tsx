import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ChevronRight, Home, BookOpen, Wrench, Rocket, CheckCircle, Clock, Circle, Plus, Search, Archive, ArrowLeft, Sun, Moon, HelpCircle, Hourglass, Lock, LoaderCircle, XCircle, Download, Zap, Users, AlertTriangle, MessageSquare, TrendingUp, Edit3, Save, CheckSquare, LogOut, Briefcase, Trash2, X, BrainCircuit, Puzzle } from 'lucide-react';
import { PhaseView } from './src/components/PhaseView';
import { Button, Card, Badge, ProgressBar } from './src/components/ui';
import { HelpModal } from './src/components/HelpModal';
import { ConfirmationModal } from './src/components/ConfirmationModal';
import { TuningControls } from './src/components/TuningControls';
import { ProjectProvider, useProject } from './src/context/ProjectContext';
import { Project, Phase, Sprint, User, Comment, Risk, Task, ToastMessage } from './src/types';
import { DocumentsPage } from './src/components/DocumentsPage';
import { runAutomatedPhaseGeneration } from './src/services/geminiService';
import { withRetry } from './src/utils';
import { ProjectHeader } from './src/components/ProjectHeader';
import { RiskEnginePanel } from './src/components/RiskEnginePanel';
import { NLPQueryInterface } from './src/components/NLPQueryInterface';
import { AnalyticsDashboard } from './src/components/AnalyticsDashboard';
import { TeamManagementPage } from './src/components/TeamManagementPage';
import { TaskManagementPage } from './src/components/TaskManagementPage';
import { Header } from './src/components/Header';
import { Hero } from './src/components/Hero';
import { Features } from './src/components/Features';
import { UnifiedLifecycle } from './src/components/UnifiedLifecycle';
import { Footer } from './src/components/Footer';
import { IntegrationsPage } from './src/components/IntegrationsPage';
import { CollaborationPanel } from './src/components/CollaborationPanel';

// --- THEME MANAGEMENT ---
const useTheme = (): [string, React.Dispatch<React.SetStateAction<string>>] => {
    const [theme, setThemeState] = useState(() => {
        if (typeof window === 'undefined') return 'dark';
        return localStorage.getItem('theme') || 'dark';
    });

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    return [theme, setThemeState];
};

// --- CONSTANTS ---
const ENGINEERING_DISCIPLINES = [
  'Mechanical Engineering', 'Electrical Engineering', 'Chemical Engineering',
  'Software Engineering', 'Civil Engineering', 'Aerospace Engineering',
  'Biomedical Engineering', 'Environmental Engineering', 'Materials Engineering',
  'Nuclear Engineering', 'Industrial Engineering', 'Systems Engineering',
  'Automotive Engineering', 'Robotics Engineering', 'Petroleum Engineering',
  'Marine Engineering', 'Agricultural Engineering', 'Structural Engineering',
  'Electronics Engineering', 'Manufacturing Engineering'
];

const PROJECT_TEMPLATES = [
    {
        name: 'Software Engineering (Web App)',
        description: 'An agile template for developing a modern web application, focusing on user stories, APIs, and cloud deployment.',
        icon: '💻',
        requirements: 'As a [user type], I want to [goal] so that I can [benefit]. The platform must handle [number] of concurrent users and have an API response time under [time]ms. The system must be deployable on a major cloud provider (e.g., GCP, AWS).',
        constraints: 'The initial MVP must be launched by [date]. The tech stack is limited to [e.g., React, Node.js, PostgreSQL]. The development team consists of [number] engineers. The project must adhere to GDPR and CCPA data privacy regulations.'
    },
    {
        name: 'Mechanical Engineering (Consumer Product)',
        description: 'A general-purpose template for physical products following a V-model lifecycle.',
        icon: '🔧',
        requirements: 'The system shall [main function], such as [specific action]. It must achieve a performance of [key metric] and operate within an environment of [operating conditions]. The product must have a lifespan of at least [number] years.',
        constraints: 'The project budget is limited to [budget]. The target completion date is [date]. All materials must comply with [industry standard, e.g., RoHS]. The unit manufacturing cost must not exceed [cost].'
    },
    {
        name: 'Aerospace Engineering (Satellite System)',
        description: 'A rigorous template for designing a small communication satellite (CubeSat) for Low Earth Orbit (LEO).',
        icon: '🛰️',
        requirements: 'The CubeSat shall provide [e.g., S-band] communication capabilities. It must survive launch-induced vibrations of [g-force value] and operate in a temperature range of [-X°C to +Y°C]. Total mass not to exceed [mass, e.g., 10 kg].',
        constraints: 'The power budget is limited to [watts]. The project must adhere to NASA General Environmental Verification Standard (GEVS). The primary structure must be a standard [e.g., 6U] CubeSat frame.'
    },
    {
        name: 'Civil Engineering (Bridge Construction)',
        description: 'A template for planning and designing a pedestrian bridge, emphasizing structural integrity and public safety.',
        icon: '🌉',
        requirements: 'The bridge must span [length] meters over [feature]. It must support a live load of [e.g., 5 kPa] and withstand wind speeds of up to [speed] km/h. The design must be compliant with AASHTO LRFD Bridge Design Specifications.',
        constraints: 'The total construction budget is [amount]. The project must be completed by [date]. Environmental impact must be minimized, with no more than [area] of wetland disturbance. Materials must be sourced from approved local suppliers.'
    },
    {
        name: 'Electrical Engineering (PCB Design)',
        description: 'A detailed template for creating a printed circuit board (PCB) for an IoT device.',
        icon: '⚡',
        requirements: 'The PCB shall host a [microcontroller, e.g., ESP32-S3] and a [sensor type, e.g., BME680 Environmental Sensor]. It must support Wi-Fi and Bluetooth 5.0. Power consumption in deep sleep mode must be below [current, e.g., 20 µA].',
        constraints: 'The board dimensions must not exceed [Xmm x Ymm]. The design must be a [number, e.g., 4]-layer board. All components must be surface-mount devices (SMD). The project must pass FCC Part 15 certification for unintentional radiators.'
    },
    {
        name: 'Biomedical Engineering (Medical Device)',
        description: 'A template for a wearable health monitor, focusing on regulatory compliance and data accuracy.',
        icon: '⚕️',
        requirements: 'The device shall continuously monitor [e.g., heart rate, SpO2, and skin temperature]. Heart rate accuracy must be within ±[e.g., 2] bpm of a medical-grade reference. Data must be securely transmitted to a mobile application via Bluetooth Low Energy.',
        constraints: 'The device must be developed under ISO 13485 quality management systems. All patient data handling must be HIPAA compliant. All materials in contact with skin must be biocompatibility tested according to ISO 10993.'
    },
    {
        name: 'Chemical Engineering (Process Plant)',
        description: 'A template for designing a small-scale water purification system.',
        icon: '⚗️',
        requirements: 'The system must process [flow rate, e.g., 1000 liters/hour] of raw water. Output water purity must meet [standard, e.g., WHO drinking water standards], with turbidity below [value] NTU. The system must operate continuously for at least [number] hours.',
        constraints: 'The overall energy consumption shall not exceed [energy/liter]. The physical footprint is limited to [Xm x Ym]. The project must adhere to local environmental discharge regulations. Capital cost must be below [amount].'
    },
    {
        name: 'Environmental Engineering (Remediation)',
        description: 'A project template for cleaning up a contaminated industrial site.',
        icon: '🌳',
        requirements: 'The project will remediate soil contaminated with [contaminant, e.g., heavy metals]. The target cleanup level for [contaminant] is [concentration, e.g., <50 mg/kg]. The remediation process must be completed within [timeframe].',
        constraints: 'The project must comply with EPA Superfund program guidelines. Total project cost cannot exceed [budget]. The chosen remediation technology (e.g., soil vapor extraction, bioremediation) must be proven for the specific contaminants.'
    },
    {
        name: 'Robotics Engineering (Autonomous Robot)',
        description: 'A template for developing an autonomous warehouse robot for package sorting.',
        icon: '🤖',
        requirements: 'The robot must autonomously navigate a warehouse environment using [e.g., LIDAR]. It must be able to identify and pick up packages up to [weight] kg. The sorting accuracy must be at least [e.g., 99.9%].',
        constraints: 'The robot must operate for a minimum of [hours] on a single charge. The system must integrate with the existing Warehouse Management System (WMS) API. The total cost per robot must not exceed [amount]. Safety systems must comply with ISO 13482.'
    },
    {
        name: 'Systems Engineering (System Integration)',
        description: 'A template for integrating a new sensor suite into an existing vehicle platform.',
        icon: '🔗',
        requirements: 'The project will integrate a [new system, e.g., thermal imaging camera] with the vehicle\'s existing [legacy system, e.g., CAN bus network]. Data from the new system must be displayed on the central console with a latency of less than [time]ms.',
        constraints: 'The integration must not require modification of the vehicle\'s primary structure. The total power draw of the new components cannot exceed [watts]. All new wiring must use mil-spec connectors and adhere to the existing vehicle wiring standards.'
    },
    {
        name: 'Materials Engineering (Alloy Development)',
        description: 'A template for R&D of a new lightweight, high-strength alloy for a specific application.',
        icon: '🔬',
        requirements: 'The new alloy must have a tensile strength greater than [value, e.g., 600 MPa] and a density less than [value, e.g., 3 g/cm³]. It must exhibit corrosion resistance comparable to [benchmark material, e.g., 7075-T6 aluminum].',
        constraints: 'The cost of raw materials for the alloy must not exceed [cost/kg]. The alloy must be manufacturable using existing casting and forging techniques. The project has a [number]-month timeline for initial sample production and testing.'
    },
    {
        name: 'Agricultural Engineering (Precision Farming Drone)',
        description: 'A template for an autonomous drone that monitors crop health using multispectral imaging.',
        icon: '🚁',
        requirements: 'The drone must be capable of flying pre-programmed routes over a [area, e.g., 100-hectare] field. It will carry a multispectral camera to calculate NDVI (Normalized Difference Vegetation Index). The system must process and deliver a crop health map within [hours] of flight.',
        constraints: 'Minimum flight time on a single battery must be [minutes]. The system must comply with FAA regulations for commercial drone operation. The total cost of the drone and sensor package must be under [amount].'
    }
];

// --- VIEW COMPONENTS ---
const ProjectSelectionView = ({ onSelectProject, onCreateNew, theme, setTheme }) => {
    const { currentUser, projects, setProjects, logout } = useProject();
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

    const handleDeleteProject = () => {
        if (!projectToDelete) return;
        setProjects(projects.filter(p => p.id !== projectToDelete.id));
        setProjectToDelete(null);
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-charcoal-900 flex flex-col items-center justify-center p-4">
            <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
                 <Button variant="outline" size="sm" onClick={logout}><LogOut className="w-4 h-4 mr-2"/> Logout</Button>
                <button
                    onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                    className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-charcoal-800"
                    aria-label="Toggle theme"
                >
                    {theme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                </button>
            </div>
            
            <Card className="w-full max-w-3xl">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Project Workspace</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Welcome back, {currentUser?.name}!
                    </p>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Your Projects</h2>
                        <Button onClick={onCreateNew}><Plus className="w-4 h-4 mr-2"/>New Project</Button>
                    </div>
                    {projects.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-1">
                            {projects.map(p => (
                                <div key={p.id} className="relative group">
                                    <Card 
                                        onClick={() => onSelectProject(p)} 
                                        className="h-full cursor-pointer hover:border-brand-primary"
                                    >
                                        <h3 className="font-bold">{p.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            Created: {new Date(p.createdAt).toLocaleDateString()}
                                        </p>
                                         <ProgressBar progress={(p.phases.findIndex(ph => ph.status !== 'completed') === -1 ? 100 : (p.phases.findIndex(ph => ph.status !== 'completed') / p.phases.length) * 100)} className="mt-3"/>
                                    </Card>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setProjectToDelete(p); }}
                                        className="absolute top-2 right-2 p-1.5 rounded-full bg-gray-200 dark:bg-charcoal-700 text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 transition-opacity"
                                        aria-label={`Delete project ${p.name}`}
                                    >
                                        <Trash2 className="w-4 h-4"/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg dark:border-charcoal-700">
                            <Briefcase className="w-12 h-12 mx-auto text-gray-400"/>
                            <p className="mt-4 text-gray-600 dark:text-gray-400">No projects yet. Create one to get started!</p>
                        </div>
                    )}
                </div>
            </Card>

            <ConfirmationModal
                isOpen={!!projectToDelete}
                onClose={() => setProjectToDelete(null)}
                onConfirm={handleDeleteProject}
                title={`Delete ${projectToDelete?.name}?`}
                description="Are you sure you want to delete this project? This action is permanent and cannot be undone."
                confirmText="Yes, Delete"
                confirmVariant="danger"
            />
        </div>
    );
};


interface ProjectWizardProps {
  onProjectCreated: (project: Project) => void;
  onCancel: () => void;
}
const ProjectWizard = ({ onProjectCreated, onCancel }: ProjectWizardProps) => {
  const { currentUser } = useProject();
  const [step, setStep] = useState(1);
  const [projectData, setProjectData] = useState({ name: '', requirements: '', constraints: '', disciplines: [] as string[] });
  const [searchTerm, setSearchTerm] = useState('');
  const [developmentMode, setDevelopmentMode] = useState<'full' | 'rapid'>('full');
  const [requirementsTuning, setRequirementsTuning] = useState({
      clarity: 70,
      technicality: 60,
      foresight: 50,
      riskAversion: 60,
      userCentricity: 75,
      conciseness: 40,
  });

  const filteredDisciplines = ENGINEERING_DISCIPLINES.filter(d => d.toLowerCase().includes(searchTerm.toLowerCase()));
  const handleDisciplineToggle = (discipline: string) => setProjectData(prev => ({ ...prev, disciplines: prev.disciplines.includes(discipline) ? prev.disciplines.filter(d => d !== discipline) : prev.disciplines.length < 3 ? [...prev.disciplines, discipline] : prev.disciplines }));
  
  const createProject = () => {
    if (!currentUser) return; // Should not happen if this component is rendered
    onProjectCreated({
      id: Date.now().toString(), userId: currentUser.id, ...projectData, developmentMode, currentPhase: 0, createdAt: new Date(), automationMode: 'hmap',
      compactedContext: '',
      metaDocuments: [],
      users: [currentUser],
      comments: {},
      phases: [
        { id: '1', name: 'Requirements', description: 'Define clear functional and performance objectives', status: 'not-started', 
            sprints: [
                { id: '1-1', name: 'Project Scope', description: 'A high-level document outlining the project\'s purpose, objectives, and deliverables.', status: 'not-started', deliverables: [], output: '' },
                { id: '1-2', name: 'Statement of Work (SOW)', description: 'A formal document detailing the work activities, deliverables, and timeline.', status: 'not-started', deliverables: [], output: '' },
                { id: '1-3', name: 'Technical Requirements Specification', description: 'A detailed specification of the technical requirements, including performance, reliability, and safety.', status: 'not-started', deliverables: [], output: '' },
            ], 
            tuningSettings: requirementsTuning, isEditable: true, designReview: { required: false, checklist: [] } 
        },
        { 
            id: '2', name: 'Preliminary Design', description: 'Create and compare initial concepts via trade studies', status: 'not-started', 
            sprints: [
                { id: '2-1', name: 'Conceptual Design Options', description: 'Generate several distinct high-level design concepts to address the project requirements.', status: 'not-started', deliverables: [], output: '' },
                { id: '2-2', name: 'Trade Study Analysis', description: 'Conduct a formal trade study to compare the generated concepts against weighted criteria and select the optimal path forward.', status: 'not-started', deliverables: [], output: '' },
                { id: '2-3', name: 'Design Review Checklist', description: 'A formal checklist to verify all preliminary design requirements and success criteria have been met before proceeding.', status: 'not-started', deliverables: [], output: '' },
            ], 
            tuningSettings: { creativity: 80, costOptimization: 50, performanceBias: 70, modularity: 60 }, isEditable: true, designReview: { required: true, checklist: [] } 
        },
        { id: '3', name: 'Critical Design', description: 'Develop a detailed, comprehensive design specification and implementation sprints', status: 'not-started', sprints: [], tuningSettings: { technicalDepth: 90, failureAnalysis: 70, manufacturability: 60, standardsAdherence: 85 }, isEditable: true, designReview: { required: true, checklist: [] } },
        { 
            id: '4', name: 'Testing', description: 'Develop formal Verification and Validation plans', status: 'not-started', 
            sprints: [
                { id: '4-1', name: 'Verification Plan', description: 'Define tests to confirm the system is built correctly to specifications ("Are we building the product right?").', status: 'not-started', deliverables: [], output: '' },
                { id: '4-2', name: 'Validation Plan', description: 'Define tests to confirm the system meets user needs and requirements ("Are we building the right product?").', status: 'not-started', deliverables: [], output: '' },
            ], 
            tuningSettings: { coverage: 90, edgeCaseFocus: 75, automationPriority: 80, destructiveTesting: 40 }, isEditable: true, designReview: { required: false, checklist: [] } 
        },
        { id: '5', name: 'Launch', description: 'Formulate a detailed launch and deployment strategy', status: 'not-started', sprints: [], tuningSettings: { phasedRollout: 70, rollbackPlan: 90, marketingCoordination: 50, userTraining: 60 }, isEditable: true, designReview: { required: false, checklist: [] } },
        { id: '6', name: 'Operation', description: 'Create an operations and maintenance manual', status: 'not-started', sprints: [], tuningSettings: { monitoring: 90, preventativeMaintenance: 80, supportProtocol: 70, incidentResponse: 85 }, isEditable: true, designReview: { required: false, checklist: [] } },
        { id: '7', name: 'Improvement', description: 'Identify and prioritize future improvements', status: 'not-started', sprints: [], tuningSettings: { userFeedback: 80, performanceAnalysis: 90, featureRoadmap: 70, competitiveLandscape: 60 }, isEditable: true, designReview: { required: false, checklist: [] } }
      ]
    });
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);
  const progress = (step / 5) * 100;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl transform transition-all" title="Create a New Engineering Project" description={`Step ${step} of 5: ${['Select Template', 'Project Definition', 'Requirements', 'Constraints', 'Disciplines'][step - 1]}`}>
        <div className="space-y-6">
          <ProgressBar progress={progress} />
          {step === 1 && (
            <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start with a Template</label>
                 <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select a template to pre-populate your project with a starting point.</p>
                 <div className="space-y-3 max-h-96 overflow-y-auto p-1">
                    {PROJECT_TEMPLATES.map(template => (
                        <button key={template.name} type="button" onClick={() => {
                            setProjectData(p => ({...p, requirements: template.requirements, constraints: template.constraints}));
                            nextStep();
                        }}
                        className="w-full text-left p-4 rounded-lg border-2 border-transparent hover:border-brand-primary bg-gray-50 dark:bg-charcoal-800/50 hover:bg-white dark:hover:bg-charcoal-800 shadow-sm transition-all"
                        >
                            <div className="flex items-start space-x-4">
                                <div className="text-2xl mt-1">{template.icon}</div>
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">{template.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{template.description}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                 </div>
            </div>
          )}
          {step === 2 && (
            <div>
              <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project Name</label>
              <input type="text" id="projectName" value={projectData.name} onChange={e => setProjectData(p => ({ ...p, name: e.target.value }))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-charcoal-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" placeholder="e.g., Autonomous Drone Delivery System" />
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Development Mode</label>
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-100 dark:bg-charcoal-900 p-1">
                  <button type="button" onClick={() => setDevelopmentMode('full')}
                    className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 dark:focus:ring-offset-charcoal-800 ${developmentMode === 'full' ? 'bg-brand-primary text-charcoal-900 shadow' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-charcoal-700'}`}>
                    Full Scale Development
                  </button>
                  <button type="button" onClick={() => setDevelopmentMode('rapid')}
                    className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 dark:focus:ring-offset-charcoal-800 ${developmentMode === 'rapid' ? 'bg-brand-primary text-charcoal-900 shadow' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-charcoal-700'}`}>
                    Rapid Prototyping
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {developmentMode === 'full' ? 'Comprehensive documentation and sprints for production-ready systems.' : 'Brief, cryptic, and concise outputs for quick ideation and prototyping.'}
                </p>
              </div>
            </div>
          )}
          {step === 3 && (
            <div>
              <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project Requirements</label>
              <textarea id="requirements" rows={5} value={projectData.requirements} onChange={e => setProjectData(p => ({ ...p, requirements: e.target.value }))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-charcoal-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" placeholder="Define the core objectives, functionalities, and performance criteria." />
              <div className="mt-6">
                <TuningControls
                  settings={requirementsTuning}
                  onChangeSettings={setRequirementsTuning}
                  title="Tune Initial Requirements Generation"
                  description="Select a profile or adjust parameters for the initial AI-generated requirements documents."
                />
              </div>
            </div>
          )}
          {step === 4 && (
            <div>
              <label htmlFor="constraints" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project Constraints</label>
              <textarea id="constraints" rows={5} value={projectData.constraints} onChange={e => setProjectData(p => ({ ...p, constraints: e.target.value }))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-charcoal-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" placeholder="List any limitations, such as budget, timeline, regulations, or available technologies." />
            </div>
          )}
          {step === 5 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Engineering Disciplines (up to 3)</label>
              <div className="mt-2 flex items-center border border-gray-300 rounded-md px-3 dark:border-gray-600">
                <Search className="w-5 h-5 text-gray-400" />
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full py-2 px-2 border-0 focus:ring-0 sm:text-sm bg-transparent dark:text-white dark:placeholder-gray-400" placeholder="Search disciplines..." />
              </div>
              <div className="mt-2 max-h-48 overflow-y-auto border rounded-md p-2 flex flex-wrap gap-2 dark:border-gray-600">
                {filteredDisciplines.map(d => (
                  <button key={d} onClick={() => handleDisciplineToggle(d)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${projectData.disciplines.includes(d) ? 'bg-brand-primary text-charcoal-900' : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-charcoal-700 dark:text-gray-300 dark:hover:bg-charcoal-600'}`}>
                    {d} {projectData.disciplines.includes(d) ? <CheckCircle className="inline ml-1 w-4 h-4" /> : <Plus className="inline ml-1 w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={step === 1 ? onCancel : prevStep}>{step === 1 ? 'Cancel' : 'Back'}</Button>
            <Button onClick={step === 5 ? createProject : nextStep} disabled={(step === 2 && !projectData.name) || (step === 5 && projectData.disciplines.length === 0)}>{step === 5 ? 'Create Project' : 'Next'}</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

interface DashboardProps {
  onSelectPhase: (index: number) => void;
  onViewDocuments: () => void;
  onViewAnalytics: () => void;
  onViewTeam: () => void;
  onViewTasks: () => void;
  onViewIntegrations: () => void;
  onExitProject: () => void;
  onUpdateProjectDetails: (updates: { requirements: string, constraints: string }) => void;
  isAutomating: boolean;
  automatingPhaseId: string | null;
  onRunAutomation: () => void;
  onStopAutomation: () => void;
  isCollaborationPanelOpen: boolean;
}
const Dashboard = ({ onSelectPhase, onViewDocuments, onViewAnalytics, onViewTeam, onViewTasks, onViewIntegrations, onExitProject, onUpdateProjectDetails, isAutomating, automatingPhaseId, onRunAutomation, onStopAutomation, isCollaborationPanelOpen }: DashboardProps) => {
  const { project, theme, setTheme } = useProject();
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editedRequirements, setEditedRequirements] = useState(project?.requirements || '');
  const [editedConstraints, setEditedConstraints] = useState(project?.constraints || '');
  
  if (!project) return null;

  const handleSaveDetails = () => {
    onUpdateProjectDetails({ requirements: editedRequirements, constraints: editedConstraints });
    setIsEditingDetails(false);
  };

  const getStatusIcon = (status: Phase['status']) => {
    switch (status) {
      case 'completed': return { icon: <CheckCircle className="w-5 h-5 text-green-500" />, color: 'text-green-500' };
      case 'in-progress': return { icon: <Clock className="w-5 h-5 text-yellow-500" />, color: 'text-yellow-500' };
      case 'in-review': return { icon: <Hourglass className="w-5 h-5 text-brand-primary" />, color: 'text-brand-primary' };
      default: return { icon: <Circle className="w-5 h-5 text-gray-400" />, color: 'text-gray-400' };
    }
  };

  const firstIncompleteIndex = project.phases.findIndex(p => p.status !== 'completed');
  const projectProgress = firstIncompleteIndex === -1 ? 100 : (firstIncompleteIndex / project.phases.length) * 100;
  
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
       <ProjectHeader
            onGoHome={onExitProject}
            theme={theme}
            setTheme={setTheme}
        />

      <main>
        <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Created on: {new Date(project.createdAt).toLocaleDateString()}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <Card title="Project Lifecycle" description="Complete each phase sequentially to unlock the next.">
                    <div className="space-y-4">
                        {project.phases.map((phase, index) => {
                            const isLocked = firstIncompleteIndex !== -1 && index > firstIncompleteIndex;
                            const isAutomatingThisPhase = phase.id === automatingPhaseId;
                            const { icon, color } = getStatusIcon(isLocked ? 'not-started' : phase.status);
                            
                            return (
                                <button key={phase.id} onClick={() => onSelectPhase(index)} disabled={isLocked || isAutomating} className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-center space-x-4 ${isLocked ? 'bg-gray-100 dark:bg-charcoal-800/50 border-gray-200 dark:border-charcoal-700/50 cursor-not-allowed opacity-60' : 'bg-white dark:bg-charcoal-800/50 border-transparent shadow-sm hover:shadow-md hover:border-brand-primary'} ${isAutomatingThisPhase ? 'animate-pulse border-brand-primary' : ''} ${isAutomating && !isAutomatingThisPhase ? 'opacity-50 cursor-wait' : ''}`}>
                                    {isAutomatingThisPhase ? (
                                        <div className="p-2 bg-blue-100 dark:bg-brand-primary/20 rounded-full text-brand-primary">
                                            <LoaderCircle className="w-5 h-5 animate-spin" />
                                        </div>
                                    ) : (
                                        <div className={`p-2 bg-gray-100 dark:bg-charcoal-700/50 rounded-full ${color}`}>{icon}</div>
                                    )}
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900 dark:text-white">{index + 1}. {phase.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{phase.description}</p>
                                    </div>
                                    {isLocked ? <Lock className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                                </button>
                            );
                        })}
                    </div>
                </Card>
            </div>
            <div className="space-y-6">
                <Card title="Project Status">
                     <div className="space-y-3">
                        <div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Progress</span>
                            <ProgressBar progress={projectProgress} className="mt-1" />
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Phase</span>
                            <p className="font-semibold text-gray-900 dark:text-white">{project.phases[firstIncompleteIndex]?.name || 'Completed'}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Disciplines</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {project.disciplines.map(d => <Badge key={d}>{d}</Badge>)}
                            </div>
                        </div>
                    </div>
                </Card>
                <RiskEnginePanel />
                <Card title="Project Details">
                    {isEditingDetails ? (
                        <div className="space-y-4 text-sm">
                            <div>
                                <label className="font-semibold text-gray-800 dark:text-gray-200">Requirements</label>
                                <textarea value={editedRequirements} onChange={e => setEditedRequirements(e.target.value)} rows={5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-charcoal-700 dark:border-gray-600" />
                            </div>
                             <div>
                                <label className="font-semibold text-gray-800 dark:text-gray-200">Constraints</label>
                                <textarea value={editedConstraints} onChange={e => setEditedConstraints(e.target.value)} rows={5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-charcoal-700 dark:border-gray-600" />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <Button variant="outline" size="sm" onClick={() => { setIsEditingDetails(false); setEditedRequirements(project.requirements); setEditedConstraints(project.constraints); }}>Cancel</Button>
                                <Button size="sm" onClick={handleSaveDetails}><Save className="w-4 h-4 mr-2" /> Save</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 text-sm">
                            <div>
                                <label className="font-semibold text-gray-800 dark:text-gray-200">Requirements</label>
                                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{project.requirements}</p>
                            </div>
                            <div>
                                <label className="font-semibold text-gray-800 dark:text-gray-200">Constraints</label>
                                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{project.constraints}</p>
                            </div>
                            <div className="flex justify-end">
                                <Button variant="outline" size="sm" onClick={() => setIsEditingDetails(true)}><Edit3 className="w-4 h-4 mr-2" /> Edit</Button>
                            </div>
                        </div>
                    )}
                </Card>
                 <Card title="Project Tools">
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" onClick={onViewDocuments}><Archive className="mr-2 w-4 h-4" />Documents</Button>
                        <Button variant="outline" onClick={onViewAnalytics}><TrendingUp className="mr-2 w-4 h-4" />Analytics</Button>
                        <Button variant="outline" onClick={onViewTeam} className="relative">
                            <Users className="mr-2 w-4 h-4" />Team
                            {isCollaborationPanelOpen && (
                                <span className="absolute top-1 right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-primary"></span>
                                </span>
                            )}
                        </Button>
                        <Button variant="outline" onClick={onViewTasks}><CheckSquare className="mr-2 w-4 h-4" />Tasks</Button>
                        <Button variant="outline" onClick={onViewIntegrations} className="col-span-2"><Puzzle className="mr-2 w-4 h-4" />Integrations</Button>
                    </div>
                </Card>
                 <Card title="Automation Engine">
                     <div className="space-y-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Automatically generate all remaining project phases sequentially.</p>
                        {isAutomating ? (
                             <Button onClick={onStopAutomation} variant="danger" className="w-full">
                                <XCircle className="mr-2 w-4 h-4" /> Stop Automation
                            </Button>
                        ) : (
                            <Button onClick={onRunAutomation} disabled={projectProgress === 100} className="w-full">
                                <Rocket className="mr-2 w-4 h-4" /> Run Full Automation
                            </Button>
                        )}
                    </div>
                </Card>
            </div>
        </div>
      </main>
    </div>
  );
};

// --- AUTH & LANDING COMPONENTS ---

const AuthModal = ({ isOpen, onClose, setToast }) => {
    const { login, signup } = useProject();
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        let success = false;
        if (isLoginView) {
            success = login(email, password);
            if (!success) setError('Invalid email or password.');
        } else {
            success = signup(name, email, password);
            if (!success) setError('A user with this email already exists.');
        }

        if (success) {
            setToast({ message: isLoginView ? 'Logged in successfully!' : 'Account created!', type: 'success' });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[100]" onClick={onClose}>
            <Card className="w-full max-w-md" onClick={e => e.stopPropagation()} noPadding>
                <div className="flex">
                    <button onClick={() => setIsLoginView(true)} className={`flex-1 p-4 text-center font-semibold ${isLoginView ? 'bg-white dark:bg-charcoal-800' : 'bg-gray-100 dark:bg-charcoal-900'}`}>Login</button>
                    <button onClick={() => setIsLoginView(false)} className={`flex-1 p-4 text-center font-semibold ${!isLoginView ? 'bg-white dark:bg-charcoal-800' : 'bg-gray-100 dark:bg-charcoal-900'}`}>Sign Up</button>
                </div>
                <div className="p-6">
                    <div className="text-center mb-4">
                      <BrainCircuit className="w-10 h-10 text-brand-primary mx-auto" />
                      <h2 className="text-2xl font-bold mt-2">Intelligent Engineer</h2>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLoginView && (
                            <div>
                                <label className="block text-sm font-medium">Name</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-charcoal-700 dark:border-gray-600" />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium">Email</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-charcoal-700 dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Password</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-charcoal-700 dark:border-gray-600" />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <Button type="submit" className="w-full">{isLoginView ? 'Login' : 'Create Account'}</Button>
                    </form>
                </div>
            </Card>
        </div>
    );
};

const LandingPage = ({ onLoginClick }) => {
    return (
        <div className="dark:bg-charcoal-900 text-white">
            <Header onLoginClick={onLoginClick} />
            <main>
                <Hero onLoginClick={onLoginClick} />
                <Features />
                <UnifiedLifecycle />
            </main>
            <Footer />
        </div>
    );
};

// --- MAIN APP COMPONENT ---

const EngineeringPartnerApp = () => {
    const { 
        project: currentProject, 
        setProject: setCurrentProject, 
        updateProject,
        theme,
        setTheme,
        currentUser
    } = useProject();

    const [currentView, setCurrentView] = useState<'projectSelection' | 'wizard' | 'dashboard' | 'phase' | 'documents' | 'analytics' | 'team' | 'tasks' | 'integrations'>('projectSelection');
    const [selectedPhaseIndex, setSelectedPhaseIndex] = useState<number | null>(null);
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [isNlpQueryOpen, setIsNlpQueryOpen] = useState(false);
    const [isAutomating, setIsAutomating] = useState(false);
    const [automatingPhaseId, setAutomatingPhaseId] = useState<string | null>(null);
    const [toast, setToast] = useState<ToastMessage | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isCollaborationPanelOpen, setIsCollaborationPanelOpen] = useState(false);
    const isAutomatingRef = useRef(false);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleSelectProject = (project: Project) => {
        setCurrentProject(project);
        setCurrentView('dashboard');
    };

    const handleCreateNew = () => setCurrentView('wizard');

    const handleProjectCreated = (project: Project) => {
        updateProject(project);
        setCurrentProject(project);
        setCurrentView('dashboard');
    };

    const handleExitProject = () => {
        setCurrentProject(null);
        setCurrentView('projectSelection');
    };
    
    const handleUpdateProjectDetails = (updates: { requirements: string, constraints: string }) => {
        if (!currentProject) return;
        const updated = { ...currentProject, ...updates };
        updateProject(updated);
        setToast({ message: 'Project details updated!', type: 'success' });
    };

    const handleSelectPhase = (index: number) => {
        setSelectedPhaseIndex(index);
        setCurrentView('phase');
    };
    
    const handleUpdatePhase = (phaseId: string, updates: Partial<Phase>) => {
        if (!currentProject) return;
        const updatedPhases = currentProject.phases.map(p => p.id === phaseId ? { ...p, ...updates } : p);
        updateProject({ ...currentProject, phases: updatedPhases });
    };

    const handlePhaseComplete = () => {
        if (!currentProject || selectedPhaseIndex === null) return;
        const currentPhase = currentProject.phases[selectedPhaseIndex];
        
        const isReviewRequired = currentPhase.designReview?.required && currentPhase.status !== 'in-review';
        
        if (!isReviewRequired) {
             const updatedPhases = currentProject.phases.map((p, index): Phase => 
                index === selectedPhaseIndex ? { ...p, status: 'completed' } : p
            );
             updateProject({ ...currentProject, phases: updatedPhases });
        }
        
        setToast({ message: `${currentPhase.name} phase updated.`, type: 'success' });
    };
    
    const handleAddComment = (phaseId: string, text: string) => {
        if (!currentProject || !currentProject.users[0]) return;
        const newComment: Comment = {
            id: `comment-${Date.now()}`,
            userId: currentProject.users[0].id,
            phaseId, text, createdAt: new Date()
        };
        const updatedComments = { ...currentProject.comments };
        if (!updatedComments[phaseId]) updatedComments[phaseId] = [];
        updatedComments[phaseId].push(newComment);
        updateProject({ ...currentProject, comments: updatedComments });
    };
    
    const handleAddTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
        if (!currentProject) return;
        const newTask: Task = { ...task, id: `task-${Date.now()}`, createdAt: new Date() };
        const updatedTasks = [...(currentProject.tasks || []), newTask];
        updateProject({ ...currentProject, tasks: updatedTasks });
        setToast({ message: 'Task added successfully!', type: 'success' });
    };
    
    const handleUpdateTask = (updatedTask: Task) => {
        if (!currentProject) return;
        const updatedTasks = (currentProject.tasks || []).map(t => t.id === updatedTask.id ? updatedTask : t);
        updateProject({ ...currentProject, tasks: updatedTasks });
    };

    const handleAutomateProject = async () => {
        if (!currentProject) return;
    
        setIsAutomating(true);
        isAutomatingRef.current = true;
        let projectState = { ...currentProject };
    
        try {
            const startIndex = projectState.phases.findIndex(p => p.status !== 'completed');
            if (startIndex === -1) {
                setToast({ message: "Project is already complete!", type: 'success' });
                return;
            }
    
            for (let i = startIndex; i < projectState.phases.length; i++) {
                if (!isAutomatingRef.current) {
                    setToast({ message: 'Automation stopped by user.', type: 'info' });
                    break;
                }
                const phase = projectState.phases[i];
                setAutomatingPhaseId(phase.id);
    
                await runAutomatedPhaseGeneration(
                    projectState,
                    phase,
                    (updates) => {
                        const updatedPhases = projectState.phases.map(p => p.id === phase.id ? { ...p, ...updates } : p);
                        projectState = { ...projectState, phases: updatedPhases };
                        updateProject(projectState); 
                    },
                    (message) => setToast({ message, type: 'info' })
                );
            }
            if (isAutomatingRef.current) {
                setToast({ message: "Project automation complete!", type: 'success' });
            }
        } catch (error: any) {
            setToast({ message: `Automation failed: ${error.message}`, type: 'error' });
        } finally {
            setIsAutomating(false);
            setAutomatingPhaseId(null);
            isAutomatingRef.current = false;
        }
    };
    
    const handleStopAutomation = () => {
        isAutomatingRef.current = false;
        setIsAutomating(false);
        setAutomatingPhaseId(null);
        setToast({ message: 'Automation stopped.', type: 'info' });
    };

    const renderContent = () => {
        if (!currentUser) {
            return <LandingPage onLoginClick={() => setIsAuthModalOpen(true)} />;
        }

        if (currentView === 'projectSelection') {
            return <ProjectSelectionView onSelectProject={handleSelectProject} onCreateNew={handleCreateNew} theme={theme} setTheme={setTheme} />;
        }
        if (currentView === 'wizard') {
            return <ProjectWizard onProjectCreated={handleProjectCreated} onCancel={() => setCurrentView('projectSelection')} />;
        }

        if (!currentProject) {
             return <ProjectSelectionView onSelectProject={handleSelectProject} onCreateNew={handleCreateNew} theme={theme} setTheme={setTheme} />;
        }
        
        switch (currentView) {
            case 'dashboard':
                return <Dashboard 
                    onSelectPhase={handleSelectPhase}
                    onExitProject={handleExitProject}
                    onUpdateProjectDetails={handleUpdateProjectDetails}
                    isAutomating={isAutomating}
                    automatingPhaseId={automatingPhaseId}
                    onRunAutomation={handleAutomateProject}
                    onStopAutomation={handleStopAutomation}
                    onViewDocuments={() => setCurrentView('documents')}
                    onViewAnalytics={() => setCurrentView('analytics')}
                    onViewTeam={() => setCurrentView('team')}
                    onViewTasks={() => setCurrentView('tasks')}
                    onViewIntegrations={() => setCurrentView('integrations')}
                    isCollaborationPanelOpen={isCollaborationPanelOpen}
                />;
            case 'phase':
                 const phase = selectedPhaseIndex !== null ? currentProject.phases[selectedPhaseIndex] : null;
                 if (!phase) {
                    setCurrentView('dashboard');
                    return null;
                 }
                return (
                    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                        <ProjectHeader onGoHome={() => setCurrentView('dashboard')} theme={theme} setTheme={setTheme} showBackButton/>
                        <PhaseView 
                            phase={phase}
                            onUpdatePhase={handleUpdatePhase}
                            onPhaseComplete={handlePhaseComplete}
                            onAddComment={handleAddComment}
                            onReturnToDashboard={() => setCurrentView('dashboard')}
                            onUpdateProject={updateProject}
                            setToast={setToast}
                        />
                    </div>
                );
            case 'documents':
                return <DocumentsPage onBack={() => setCurrentView('dashboard')} setToast={setToast}/>;
            case 'analytics':
                return <AnalyticsDashboard onBack={() => setCurrentView('dashboard')} />;
            case 'team':
                return <TeamManagementPage onBack={() => setCurrentView('dashboard')} setToast={setToast}/>;
            case 'tasks':
                return <TaskManagementPage onBack={() => setCurrentView('dashboard')} setToast={setToast} onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} />;
            case 'integrations':
                return <IntegrationsPage onBack={() => setCurrentView('dashboard')} />;
            default:
                 return <ProjectSelectionView onSelectProject={handleSelectProject} onCreateNew={handleCreateNew} theme={theme} setTheme={setTheme} />;
        }
    };

    return (
        <div className="relative">
            {renderContent()}
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} setToast={setToast} />
            {currentUser && (
              <>
                {isHelpModalOpen && <HelpModal onClose={() => setIsHelpModalOpen(false)} />}
                {isCollaborationPanelOpen && <CollaborationPanel isOpen={isCollaborationPanelOpen} onClose={() => setIsCollaborationPanelOpen(false)} />}
                <NLPQueryInterface isOpen={isNlpQueryOpen} onClose={() => setIsNlpQueryOpen(false)} />
                <div className="fixed bottom-4 right-4 flex flex-col space-y-2 z-50">
                    <Button variant="secondary" onClick={() => setIsCollaborationPanelOpen(true)} className="rounded-full !p-3 shadow-lg">
                        <Users className="w-6 h-6"/>
                    </Button>
                    <Button variant="secondary" onClick={() => setIsNlpQueryOpen(true)} className="rounded-full !p-3 shadow-lg">
                        <MessageSquare className="w-6 h-6"/>
                    </Button>
                    <Button variant="secondary" onClick={() => setIsHelpModalOpen(true)} className="rounded-full !p-3 shadow-lg">
                        <HelpCircle className="w-6 h-6"/>
                    </Button>
                </div>
              </>
            )}
            <Toast toast={toast} onClose={() => setToast(null)} />
        </div>
    );
};

const Toast = ({ toast, onClose }: { toast: ToastMessage | null, onClose: () => void }) => {
  if (!toast) return null;

  const typeClasses = {
      success: 'text-green-500 bg-green-100 dark:bg-green-800 dark:text-green-200',
      error: 'text-red-500 bg-red-100 dark:bg-red-800 dark:text-red-200',
      info: 'text-blue-500 bg-blue-100 dark:bg-blue-800 dark:text-blue-200'
  }
  const icon = {
      success: <CheckCircle className="w-5 h-5" />,
      error: <XCircle className="w-5 h-5" />,
      info: <AlertTriangle className="w-5 h-5" />
  }

  return (
    <div className={`fixed top-5 right-5 flex items-center w-full max-w-xs p-4 space-x-4 rtl:space-x-reverse divide-x rtl:divide-x-reverse rounded-lg shadow-lg text-gray-400 bg-white dark:text-gray-400 dark:bg-charcoal-800 space-x-3 divide-gray-200 dark:divide-charcoal-700 z-[101]`} role="alert">
      <div className={`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 ${typeClasses[toast.type]} rounded-lg`}>
        {icon[toast.type]}
      </div>
      <div className="ps-4 text-sm font-normal text-gray-600 dark:text-gray-300">{toast.message}</div>
      <button type="button" onClick={onClose} className="p-1.5 -m-1.5 ms-auto inline-flex items-center justify-center text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-white dark:bg-charcoal-800 dark:hover:bg-charcoal-700" aria-label="Close">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const AppWrapper = () => {
    const [theme, setTheme] = useTheme();
    return (
        <ProjectProvider theme={theme as string} setTheme={setTheme as (theme: string) => void}>
            <EngineeringPartnerApp />
        </ProjectProvider>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);