import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { ChevronRight, Download, Home, BookOpen, Wrench, Rocket, CheckCircle, Clock, Circle, Plus, Search, FileText, Archive, ArrowLeft, Sun, Moon, HelpCircle, Hourglass, Lock } from 'lucide-react';
import { PhaseView } from './src/components/PhaseView';
import { Button, Card, Badge, ProgressBar } from './src/components/ui';
import { HelpModal } from './src/components/HelpModal';

// --- THEME MANAGEMENT ---
const useTheme = () => {
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

const ThemeToggleButton = ({ theme, setTheme }) => {
    const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
            aria-label="Toggle theme"
        >
            {theme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
        </button>
    );
};


// --- TYPES AND INTERFACES ---
interface Project {
  id: string;
  name: string;
  requirements: string;
  constraints: string;
  disciplines: string[];
  currentPhase: number;
  phases: Phase[];
  createdAt: Date;
}

interface Phase {
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
    checklist: { id: string; text: string; checked: boolean }[];
  };
}

interface Sprint {
  id:string;
  name: string;
  description: string;
  status: 'not-started' | 'in-progress' | 'completed';
  deliverables: string[];
  output?: string;
}

interface TuningSettings {
  [key: string]: number | string | boolean;
}

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

const sanitizeFilename = (name: string): string => name.replace(/[\\/?%*:|"<>.\s]/g, '_');


// --- VIEW COMPONENTS ---

const LandingPage = ({ onStartProject, theme, setTheme }) => {
    const phaseGroups = [
        { 
            title: 'Foundation', 
            phases: [
                { name: 'Requirements', description: 'Define clear functional and performance objectives.' },
                { name: 'Preliminary Design', description: 'Create and compare initial concepts via trade studies.' },
            ], 
            icon: <BookOpen className="w-6 h-6" />, color: 'from-blue-500 to-cyan-500' 
        },
        { 
            title: 'Development', 
            phases: [
                { name: 'Critical Design', description: 'Develop the detailed, comprehensive design specification.' },
                { name: 'Testing', description: 'Verify and validate that you built the right product, right.' },
            ], 
            icon: <Wrench className="w-6 h-6" />, color: 'from-purple-500 to-pink-500' 
        },
        { 
            title: 'Delivery & Beyond', 
            phases: [
                { name: 'Launch', description: 'Formulate a detailed launch and deployment strategy.' },
                { name: 'Operation', description: 'Create an operations and maintenance manual.' },
                { name: 'Improvement', description: 'Identify and prioritize future improvements.' },
            ], 
            icon: <Rocket className="w-6 h-6" />, color: 'from-green-500 to-emerald-500' 
        }
    ];

  const features = [
    { title: 'AI-Powered Generation', description: 'Intelligent, context-aware engineering assistance tailored to your discipline', icon: <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">AI</div> },
    { title: 'Context Propagation', description: 'Full memory across all phases, ensuring continuity and consistency', icon: <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center text-white">⚡</div> },
    { title: 'Domain Toolkits', description: 'Tools and outputs tailored to each supported engineering discipline', icon: <Wrench className="w-8 h-8 text-orange-500" /> },
    { title: 'Document Generation', description: 'Professional deliverables in multiple formats ready for download', icon: <Download className="w-8 h-8 text-purple-500" /> },
    { title: 'HMAP Integration', description: 'Human-Mediated Agentic Process ensuring quality and oversight', icon: <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold">H</div> },
    { title: 'Lean & Agile Process', description: 'Best-in-class, SpaceX-derived processes including sprints and a Minimum Viable Product focus. "The best part is no part."', icon: <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold">🚀</div> }
  ];

  const mificoColors = [
      '#38bdf8', // sky-400
      '#4ade80', // green-400
      '#f472b6', // pink-400
      '#facc15', // yellow-400
      '#fb923c', // orange-400
      '#c084fc', // purple-400
  ];

  const styledMifeco = (
      <strong className="font-bold tracking-wider">
          {'MIFECO'.split('').map((letter, index) => (
              <span key={index} style={{ color: mificoColors[index] }}>{letter}</span>
          ))}
      </strong>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/50 dark:to-purple-900/50">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggleButton theme={theme} setTheme={setTheme} />
      </div>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-600/20 dark:to-purple-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">Intelligent <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Engineering</span></h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">An AI-powered companion that guides you through the full lifecycle of engineering development using proven HMAP methodologies</p>
            <Button size="lg" onClick={onStartProject} className="text-lg px-8 py-4"><>Start New Project <ChevronRight className="ml-2 w-5 h-5" /></></Button>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">This application created by {styledMifeco} a Mars Technology Institute (MTI) affiliate.</p>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">Powerful Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="text-center hover:scale-105 transition-transform duration-200">
              <div className="flex justify-center mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">Engineering Workflow</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {phaseGroups.map((group, index) => (
            <Card key={index}>
              <div className="flex flex-col items-center text-center">
                <div className={`w-12 h-12 bg-gradient-to-r ${group.color} rounded-lg flex items-center justify-center text-white mx-auto mb-4`}>{group.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{group.title}</h3>
              </div>
              <div className="space-y-4 text-left">
                {group.phases.map((phase, phaseIndex) => (
                    <div key={phaseIndex}>
                        <p className="font-semibold text-gray-800 dark:text-gray-200">{phase.name}</p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">{phase.description}</p>
                    </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-lg text-gray-700 dark:text-gray-300">“This application provides real engineers with very rapid project planning and detailed documentation. It can also help provide training in project management and execution and help anyone who wants to run a successful project.”</p>
      </div>
      <footer className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
        Made by {styledMifeco} @2025
      </footer>
    </div>
  );
};

const ProjectWizard = ({ onProjectCreated, onCancel }) => {
  const [step, setStep] = useState(1);
  const [projectData, setProjectData] = useState({ name: '', requirements: '', constraints: '', disciplines: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const filteredDisciplines = ENGINEERING_DISCIPLINES.filter(d => d.toLowerCase().includes(searchTerm.toLowerCase()));
  const handleDisciplineToggle = (discipline) => setProjectData(prev => ({ ...prev, disciplines: prev.disciplines.includes(discipline) ? prev.disciplines.filter(d => d !== discipline) : prev.disciplines.length < 3 ? [...prev.disciplines, discipline] : prev.disciplines }));
  const createProject = () => {
    onProjectCreated({
      id: Date.now().toString(), ...projectData, currentPhase: 0, createdAt: new Date(),
      phases: [
        { id: '1', name: 'Requirements', description: 'Define clear functional and performance objectives', status: 'not-started', 
            sprints: [
                { id: '1-1', name: 'Project Scope', description: 'A high-level document outlining the project\'s purpose, objectives, and deliverables.', status: 'not-started', deliverables: [], output: '' },
                { id: '1-2', name: 'Statement of Work (SOW)', description: 'A formal document detailing the work activities, deliverables, and timeline.', status: 'not-started', deliverables: [], output: '' },
                { id: '1-3', name: 'Technical Requirements Specification', description: 'A detailed specification of the technical requirements, including performance, reliability, and safety.', status: 'not-started', deliverables: [], output: '' },
            ], 
            tuningSettings: { detailLevel: 75, constraintWeight: 60, riskTolerance: 50, complianceStrictness: 80 }, isEditable: true, designReview: { required: false, checklist: [] } 
        },
        { 
            id: '2', name: 'Preliminary Design', description: 'Create and compare initial concepts via trade studies', status: 'not-started', 
            sprints: [
                { id: '2-1', name: 'Conceptual Design Options', description: 'Generate several distinct high-level design concepts to address the project requirements.', status: 'not-started', deliverables: [], output: '' },
                { id: '2-2', name: 'Trade Study Analysis', description: 'Conduct a formal trade study to compare the generated concepts against weighted criteria and select the optimal path forward.', status: 'not-started', deliverables: [], output: '' },
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
  const progress = (step / 4) * 100;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl transform transition-all" title="Create a New Engineering Project" description={`Step ${step} of 4: ${['Project Name', 'Requirements', 'Constraints', 'Disciplines'][step - 1]}`}>
        <div className="space-y-6">
          <ProgressBar progress={progress} />
          {step === 1 && (
            <div>
              <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project Name</label>
              <input type="text" id="projectName" value={projectData.name} onChange={e => setProjectData(p => ({ ...p, name: e.target.value }))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" placeholder="e.g., Autonomous Drone Delivery System" />
            </div>
          )}
          {step === 2 && (
            <div>
              <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project Requirements</label>
              <textarea id="requirements" rows={5} value={projectData.requirements} onChange={e => setProjectData(p => ({ ...p, requirements: e.target.value }))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" placeholder="Define the core objectives, functionalities, and performance criteria." />
            </div>
          )}
          {step === 3 && (
            <div>
              <label htmlFor="constraints" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project Constraints</label>
              <textarea id="constraints" rows={5} value={projectData.constraints} onChange={e => setProjectData(p => ({ ...p, constraints: e.target.value }))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" placeholder="List any limitations, such as budget, timeline, regulations, or available technologies." />
            </div>
          )}
          {step === 4 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Engineering Disciplines (up to 3)</label>
              <div className="mt-2 flex items-center border border-gray-300 rounded-md px-3 dark:border-gray-600">
                <Search className="w-5 h-5 text-gray-400" />
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full py-2 px-2 border-0 focus:ring-0 sm:text-sm bg-transparent dark:text-white dark:placeholder-gray-400" placeholder="Search disciplines..." />
              </div>
              <div className="mt-2 max-h-48 overflow-y-auto border rounded-md p-2 flex flex-wrap gap-2 dark:border-gray-600">
                {filteredDisciplines.map(d => (
                  <button key={d} onClick={() => handleDisciplineToggle(d)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${projectData.disciplines.includes(d) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}>
                    {d} {projectData.disciplines.includes(d) ? <CheckCircle className="inline ml-1 w-4 h-4" /> : <Plus className="inline ml-1 w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={step === 1 ? onCancel : prevStep}>{step === 1 ? 'Cancel' : 'Back'}</Button>
            <Button onClick={step === 4 ? createProject : nextStep} disabled={(step === 1 && !projectData.name) || (step === 4 && projectData.disciplines.length === 0)}>{step === 4 ? 'Create Project' : 'Next'}</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

const DocumentsPage = ({ project, onBack }) => {
  if (!project) return null;

  const downloadMarkdownFile = (content, fileName) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizeFilename(fileName)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const downloadAllAsZip = async () => {
    const JSZip = (window as any).JSZip;
    if (!JSZip) {
      console.error("JSZip library not found.");
      return;
    }
    const zip = new JSZip();

    const summaryContent = `
# Project Summary: ${project.name}

## Disciplines
- ${project.disciplines.join('\n- ')}

## Requirements
${project.requirements}

## Constraints
${project.constraints}
    `;
    zip.file("00_Project_Summary.md", summaryContent.trim());

    project.phases.forEach((phase, index) => {
      const phaseNumber = String(index + 1).padStart(2, '0');
      const phaseFolderName = `${phaseNumber}_${sanitizeFilename(phase.name)}`;
      
      const phaseFolder = zip.folder(phaseFolderName);

      if (phase.output) {
        phaseFolder.file(`_Phase_Specification.md`, phase.output);
      }

      if (phase.sprints && phase.sprints.length > 0) {
        phase.sprints.forEach(sprint => {
          if (sprint.output) {
            phaseFolder.file(`${sanitizeFilename(sprint.name)}.md`, sprint.output);
          }
        });
      }
    });

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizeFilename(project.name)}_Project_Archive.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const hasAnyDocuments = project.phases.some(p => p.output || (p.sprints && p.sprints.some(s => s.output)));

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={onBack} aria-label="Back to Dashboard"><ArrowLeft className="w-4 h-4" /></Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Project Documents</h1>
        </div>
        <Button onClick={downloadAllAsZip} disabled={!hasAnyDocuments}>
          <Archive className="mr-2 w-4 h-4" /> Download All as .zip
        </Button>
      </div>

      {!hasAnyDocuments ? (
        <Card>
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No Documents Generated</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Start by generating output for a project phase.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {project.phases.map(phase => {
            const phaseDocs = phase.sprints?.filter(s => s.output) || [];
            const hasMainDoc = !!phase.output;
            if (!hasMainDoc && phaseDocs.length === 0) return null;

            return (
              <Card key={phase.id} title={phase.name} description={phase.description}>
                <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
                  {hasMainDoc && (
                    <li className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Main Specification</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{phase.output.length.toLocaleString()} characters</p>
                        </div>
                      </div>
                      <Button variant={phase.status === 'completed' ? 'primary' : 'outline'} size="sm" onClick={() => downloadMarkdownFile(phase.output, `${project.name}_${phase.name}`)}>
                        <Download className="mr-2 w-4 h-4" /> Download .md
                      </Button>
                    </li>
                  )}
                  {phaseDocs.map(sprint => (
                     <li key={sprint.id} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <FileText className="w-6 h-6 text-indigo-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Sprint: {sprint.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{sprint.output.length.toLocaleString()} characters</p>
                          </div>
                        </div>
                        <Button variant={sprint.status === 'completed' ? 'primary' : 'outline'} size="sm" onClick={() => downloadMarkdownFile(sprint.output, `${project.name}_${phase.name}_${sprint.name}`)}>
                          <Download className="mr-2 w-4 h-4" /> Download .md
                        </Button>
                      </li>
                  ))}
                </ul>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  );
};


const Dashboard = ({ project, onSelectPhase, onViewDocuments, theme, setTheme }) => {
  const completedPhases = project.phases.filter(p => p.status === 'completed').length;
  const progress = (completedPhases / project.phases.length) * 100;
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in-progress': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'in-review': return <Hourglass className="w-5 h-5 text-blue-500" />;
      default: return <Circle className="w-5 h-5 text-gray-400 dark:text-gray-500" />;
    }
  };

  const firstIncompleteIndex = project.phases.findIndex(p => p.status !== 'completed');
  
  const downloadAllAsZip = async () => {
    const JSZip = (window as any).JSZip;
    if (!JSZip) {
      console.error("JSZip library not found.");
      return;
    }
    const zip = new JSZip();

    const summaryContent = `
# Project Summary: ${project.name}

## Disciplines
- ${project.disciplines.join('\n- ')}

## Requirements
${project.requirements}

## Constraints
${project.constraints}
    `;
    zip.file("00_Project_Summary.md", summaryContent.trim());

    project.phases.forEach((phase, index) => {
      const phaseNumber = String(index + 1).padStart(2, '0');
      const phaseFolderName = `${phaseNumber}_${sanitizeFilename(phase.name)}`;
      
      const phaseFolder = zip.folder(phaseFolderName);

      if (phase.output) {
        phaseFolder.file(`_Phase_Specification.md`, phase.output);
      }

      if (phase.sprints && phase.sprints.length > 0) {
        phase.sprints.forEach(sprint => {
          if (sprint.output) {
            phaseFolder.file(`${sanitizeFilename(sprint.name)}.md`, sprint.output);
          }
        });
      }
    });

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizeFilename(project.name)}_Project_Archive.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
         <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
         <div className="flex items-center gap-2">
            <Button onClick={downloadAllAsZip}>
                <Archive className="mr-2 w-4 h-4" /> Download Project Archive
            </Button>
           <Button variant="ghost" onClick={onViewDocuments}>
               <BookOpen className="mr-2 w-4 h-4" /> View Documents
           </Button>
           <ThemeToggleButton theme={theme} setTheme={setTheme} />
         </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card title="Disciplines"><Badge>{project.disciplines[0]}</Badge>{project.disciplines.length > 1 && <Badge>+{project.disciplines.length - 1} more</Badge>}</Card>
        <Card title="Requirements">{project.requirements.substring(0, 100)}{project.requirements.length > 100 ? '...' : ''}</Card>
        <Card title="Constraints">{project.constraints.substring(0, 100)}{project.constraints.length > 100 ? '...' : ''}</Card>
      </div>
      <Card title="Project Progress">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">{completedPhases} of {project.phases.length} phases complete</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{Math.round(progress)}%</p>
        </div>
        <ProgressBar progress={progress} />
      </Card>
      <div className="mt-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Project Lifecycle</h2>
        <div className="space-y-3">
          {project.phases.map((phase, index) => {
            const isLocked = firstIncompleteIndex !== -1 && index > firstIncompleteIndex;
            return (
              <button key={phase.id} onClick={() => onSelectPhase(index)} disabled={isLocked} className="w-full text-left disabled:opacity-60 disabled:cursor-not-allowed">
                <Card className={isLocked ? 'bg-gray-100 dark:bg-gray-800/50' : 'hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20'}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(phase.status)}
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{phase.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{phase.description}</p>
                      </div>
                    </div>
                     {isLocked ? (
                        <Lock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    )}
                  </div>
                </Card>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---
const EngineeringPartnerApp = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'wizard' | 'dashboard' | 'phase' | 'documents'>('landing');
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState<number | null>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [theme, setTheme] = useTheme();

  const handleProjectCreated = (project) => {
    setCurrentProject(project);
    setCurrentView('dashboard');
  };

  const handleSelectPhase = (index) => {
    setSelectedPhaseIndex(index);
    setCurrentView('phase');
  };

  const handleUpdatePhase = (phaseId, updates) => {
    setCurrentProject(prevProject => {
      if (!prevProject) return null;
      const newPhases = prevProject.phases.map(p => p.id === phaseId ? { ...p, ...updates } : p);
      
      const isCompleting = updates.status && (updates.status === 'completed' || updates.status === 'in-review');
      if (isCompleting) {
        setTimeout(() => {
          // Check if the current view is still the phase view before navigating away
          if (selectedPhaseIndex !== null && prevProject.phases[selectedPhaseIndex].id === phaseId) {
            setCurrentView('dashboard');
          }
        }, 100); // A small delay to let the user see the status change
      }

      return { ...prevProject, phases: newPhases };
    });
  };

  const renderContent = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage onStartProject={() => setCurrentView('wizard')} theme={theme} setTheme={setTheme} />;
      case 'wizard':
        return <ProjectWizard onProjectCreated={handleProjectCreated} onCancel={() => setCurrentView('landing')} />;
      case 'dashboard':
        return currentProject && <Dashboard project={currentProject} onSelectPhase={handleSelectPhase} onViewDocuments={() => setCurrentView('documents')} theme={theme} setTheme={setTheme} />;
      case 'phase':
        return currentProject && selectedPhaseIndex !== null && (
          <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
            <Button variant="outline" onClick={() => setCurrentView('dashboard')} className="mb-6">
              <Home className="mr-2 w-4 h-4" />Back to Dashboard
            </Button>
            <PhaseView
              project={currentProject}
              phase={currentProject.phases[selectedPhaseIndex]}
              onUpdatePhase={handleUpdatePhase}
              disciplines={currentProject.disciplines}
            />
          </div>
        );
      case 'documents':
        return currentProject && <DocumentsPage project={currentProject} onBack={() => setCurrentView('dashboard')} />;
      default:
        return <LandingPage onStartProject={() => setCurrentView('wizard')} theme={theme} setTheme={setTheme} />;
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      {renderContent()}
      <button
        onClick={() => setIsHelpModalOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform duration-200"
        aria-label="Open help guide"
      >
        <HelpCircle className="w-6 h-6" />
      </button>
      {isHelpModalOpen && <HelpModal onClose={() => setIsHelpModalOpen(false)} />}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><EngineeringPartnerApp /></React.StrictMode>);