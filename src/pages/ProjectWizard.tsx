import React, { useState } from 'react';
import { CheckCircle, Plus, Search } from 'lucide-react';
import { Button, Card, ProgressBar } from '../components/ui';
import { TuningControls } from '../components/TuningControls';
import { useProject } from '../context/ProjectContext';
import { Project, Phase } from '../types';
import { PROJECT_TEMPLATES, ENGINEERING_DISCIPLINES } from '../constants';

interface ProjectWizardProps {
  onProjectCreated: (project: Project) => void;
  onCancel: () => void;
}
export const ProjectWizard = ({ onProjectCreated, onCancel }: ProjectWizardProps) => {
  const { currentUser } = useProject();
  const [step, setStep] = useState(1);
  const [projectData, setProjectData] = useState({ name: '', description: '', requirements: '', constraints: '', disciplines: [] as string[] });
  const [searchTerm, setSearchTerm] = useState('');
  const [developmentMode, setDevelopmentMode] = useState<'full' | 'rapid'>('full');
  const [hasInteracted, setHasInteracted] = useState({ requirements: false, constraints: false });
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
      <Card className="w-full max-w-2xl transform transition-all flex flex-col" title="Create a New Engineering Project" description={`Step ${step} of 5: ${['Select Template', 'Project Definition', 'Requirements', 'Constraints', 'Disciplines'][step - 1]}`}>
        <div className="space-y-6 flex-grow overflow-y-auto p-6 -m-6 mt-0">
          <ProgressBar progress={progress} />
          {step === 1 && (
            <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start with a Template</label>
                 <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select a template to pre-populate your project with a starting point.</p>
                 <div className="space-y-3 max-h-96 overflow-y-auto p-1">
                    {PROJECT_TEMPLATES.map(template => (
                        <button key={template.name} type="button" onClick={() => {
                            setProjectData(p => ({...p, description: template.description, requirements: template.requirements, constraints: template.constraints}));
                            setHasInteracted({ requirements: false, constraints: false });
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
              <div className="mt-4">
                <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project Description</label>
                <textarea id="projectDescription" value={projectData.description} onChange={e => setProjectData(p => ({ ...p, description: e.target.value }))} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-charcoal-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" placeholder="A brief summary of the project's purpose and goals." />
              </div>
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
              <textarea id="requirements" rows={5} value={projectData.requirements} 
                onFocus={() => setHasInteracted(p => ({ ...p, requirements: true }))}
                onChange={e => {
                    setProjectData(p => ({ ...p, requirements: e.target.value }));
                    setHasInteracted(p => ({ ...p, requirements: true }));
                }} 
                className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-charcoal-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white ${!hasInteracted.requirements ? 'text-gray-400 dark:text-gray-500' : ''}`} placeholder="Define the core objectives, functionalities, and performance criteria." />
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
              <textarea id="constraints" rows={5} value={projectData.constraints} 
                onFocus={() => setHasInteracted(p => ({ ...p, constraints: true }))}
                onChange={e => {
                  setProjectData(p => ({ ...p, constraints: e.target.value }));
                  setHasInteracted(p => ({ ...p, constraints: true }));
                }}
                className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-charcoal-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white ${!hasInteracted.constraints ? 'text-gray-400 dark:text-gray-500' : ''}`} placeholder="List any limitations, such as budget, timeline, regulations, or available technologies." />
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
        </div>
        <div className="flex justify-between mt-8 p-6 pt-0 -m-6 mb-0">
          <Button variant="outline" onClick={step === 1 ? onCancel : prevStep}>{step === 1 ? 'Cancel' : 'Back'}</Button>
          <Button onClick={step === 5 ? createProject : nextStep} disabled={(step === 2 && !projectData.name) || (step === 5 && projectData.disciplines.length === 0)}>{step === 5 ? 'Create Project' : 'Next'}</Button>
        </div>
      </Card>
    </div>
  );
};
