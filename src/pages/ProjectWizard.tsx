import React, { useState } from 'react';
import { CheckCircle, Plus, Search, LoaderCircle, Shield, Sparkles } from 'lucide-react';
import { Button, Card, ProgressBar } from '../components/ui';
import { TuningControls } from '../components/TuningControls';
import { useProject } from '../context/ProjectContext';
import { Project, Phase } from '../types';
import { PROJECT_TEMPLATES, ENGINEERING_DISCIPLINES, COMPLIANCE_STANDARDS } from '../constants';
import { generateTailoredPhaseDescriptions, generateInitialProjectDocs } from '../services/geminiService';

interface ProjectWizardProps {
  onProjectCreated: (project: Project) => void;
  onCancel: () => void;
}
export const ProjectWizard = ({ onProjectCreated, onCancel }: ProjectWizardProps) => {
  const { currentUser, addProject } = useProject();
  const [step, setStep] = useState(1);
  const [projectData, setProjectData] = useState({ name: '', description: '', requirements: '', constraints: '', disciplines: [] as string[], complianceStandards: [] as string[], customConcept: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [developmentMode, setDevelopmentMode] = useState<'full' | 'rapid'>('full');
  const [hasInteracted, setHasInteracted] = useState({ requirements: false, constraints: false });
  const [selectedTemplateName, setSelectedTemplateName] = useState('');
  const [isGenerating, setIsGenerating] = useState<'requirements' | 'constraints' | null>(null);
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
  
  const filteredStandards = COMPLIANCE_STANDARDS.filter(d => d.toLowerCase().includes(searchTerm.toLowerCase()));
  const handleStandardToggle = (standard: string) => setProjectData(prev => ({ ...prev, complianceStandards: prev.complianceStandards.includes(standard) ? prev.complianceStandards.filter(s => s !== standard) : [...prev.complianceStandards, standard] }));

  const handleGenerateDoc = async (docType: 'requirements' | 'constraints') => {
        setIsGenerating(docType);
        try {
            const result = await generateInitialProjectDocs(
                projectData,
                docType,
                docType === 'requirements' ? requirementsTuning : undefined
            );
            setProjectData(p => ({ ...p, [docType]: result }));
            setHasInteracted(p => ({ ...p, [docType]: true }));
        } catch (err) {
            console.error(`Failed to generate ${docType}:`, err);
            // Optionally set a toast message here
        } finally {
            setIsGenerating(null);
        }
    };

  const createProject = async () => {
    if (!currentUser) return;
    setStep(7); // Move to the finalizing step
    
    const basePhasesData = [
        { name: 'Feasibility Study', description: 'Determine if the project is technically, economically, and strategically viable before committing significant resources.', sprints: [], tuningSettings: { marketAnalysis: 80, technicalFeasibility: 90, economicViability: 70, pestAnalysis: 60 }, isEditable: true, designReview: { required: false, checklist: [] } },
        { name: 'Requirements', description: 'Define clear functional and performance objectives', 
            sprints: [
                { id: 'req-1', name: 'Project Scope', description: 'A high-level document outlining the project\'s purpose, objectives, and deliverables.' },
                { id: 'req-2', name: 'Statement of Work (SOW)', description: 'A formal document detailing the work activities, deliverables, and timeline.' },
                { id: 'req-3', name: 'Technical Requirements Specification', description: 'A detailed specification of the technical requirements, including performance, reliability, and safety.' },
            ], 
            tuningSettings: requirementsTuning, isEditable: true, designReview: { required: false, checklist: [] } 
        },
        { 
            name: 'Preliminary Design', description: 'Create and compare initial concepts via trade studies', 
            sprints: [
                { id: 'pd-1', name: 'Conceptual Design Options', description: 'Generate several distinct high-level design concepts to address the project requirements.' },
                { id: 'pd-2', name: 'Trade Study Analysis', description: 'Conduct a formal trade study to compare the generated concepts against weighted criteria and select the optimal path forward.' },
                { id: 'pd-3', name: 'Design Review Checklist', description: 'A formal checklist to verify all preliminary design requirements and success criteria have been met before proceeding.' },
            ], 
            tuningSettings: { creativity: 80, costOptimization: 50, performanceBias: 70, modularity: 60 }, isEditable: true, designReview: { required: true, checklist: [] } 
        },
        { name: 'Critical Design', description: 'Develop a detailed, comprehensive design specification and implementation sprints', sprints: [], tuningSettings: { technicalDepth: 90, failureAnalysis: 70, manufacturability: 60, standardsAdherence: 85 }, isEditable: true, designReview: { required: true, checklist: [] } },
        { 
            name: 'Testing', description: 'Develop formal Verification and Validation plans', 
            sprints: [
                { id: 'test-1', name: 'Verification Plan', description: 'Define tests to confirm the system is built correctly to specifications ("Are we building the product right?").' },
                { id: 'test-2', name: 'Validation Plan', description: 'Define tests to confirm the system meets user needs and requirements ("Are we building the right product?").' },
            ], 
            tuningSettings: { coverage: 90, edgeCaseFocus: 75, automationPriority: 80, destructiveTesting: 40 }, isEditable: true, designReview: { required: false, checklist: [] } 
        },
        { name: 'Launch', description: 'Formulate a detailed launch and deployment strategy', sprints: [], tuningSettings: { phasedRollout: 70, rollbackPlan: 90, marketingCoordination: 50, userTraining: 60 }, isEditable: true, designReview: { required: false, checklist: [] } },
        { name: 'Operation', description: 'Create an operations and maintenance manual', sprints: [], tuningSettings: { monitoring: 90, preventativeMaintenance: 80, supportProtocol: 70, incidentResponse: 85 }, isEditable: true, designReview: { required: false, checklist: [] } },
        { name: 'Improvement', description: 'Identify and prioritize future improvements', sprints: [], tuningSettings: { userFeedback: 80, performanceAnalysis: 90, featureRoadmap: 70, competitiveLandscape: 60 }, isEditable: true, designReview: { required: false, checklist: [] } }
      ];
    
    let tailoredDescriptions = {};
    if (process.env.API_KEY) {
        try {
            const phaseList = basePhasesData.map(p => ({ name: p.name, description: p.description }));
            tailoredDescriptions = await generateTailoredPhaseDescriptions(projectData.disciplines, phaseList);
        } catch (error) {
            console.error("Could not tailor phase descriptions, using defaults.", error);
        }
    }

    const finalPhases: Phase[] = basePhasesData.map(phaseData => ({
        id: crypto.randomUUID(),
        name: phaseData.name,
        description: (tailoredDescriptions as any)[phaseData.name] || phaseData.description,
        status: 'not-started',
        outputs: [],
        sprints: phaseData.sprints.map(sprintData => ({
            id: crypto.randomUUID(),
            name: sprintData.name,
            description: sprintData.description,
            status: 'not-started',
            deliverables: [],
            outputs: [],
        })),
        tuningSettings: phaseData.tuningSettings,
        isEditable: phaseData.isEditable,
        designReview: phaseData.designReview,
    }));

    const newProject: Project = {
      id: crypto.randomUUID(), userId: currentUser.id, ...projectData, templateName: selectedTemplateName, developmentMode, currentPhase: 0, createdAt: new Date(), automationMode: 'hmap',
      compactedContext: '',
      metaDocuments: [],
      users: [currentUser],
      comments: {},
      phases: finalPhases,
    };
    
    addProject(newProject);
    onProjectCreated(newProject);
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);
  const progress = (step / 7) * 100;
  const titles = ['Select Template', 'Project Definition', 'Disciplines', 'Compliance', 'Requirements', 'Constraints', 'Finalizing Project...'];

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl transform transition-all flex flex-col" title="Create a New Engineering Project" description={`Step ${step} of 7: ${titles[step - 1]}`}>
        <div className="space-y-6 flex-grow overflow-y-auto p-6 -m-6 mt-0">
          <ProgressBar progress={progress} />
          {step === 1 && (
            <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start with a Template</label>
                 <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select a template to pre-populate your project with a starting point.</p>
                 <div className="space-y-3 max-h-96 overflow-y-auto p-1">
                    {PROJECT_TEMPLATES.map(template => (
                        <button key={template.name} type="button" 
                            onClick={() => {
                                setSelectedTemplateName(template.name);
                                setProjectData(p => ({
                                    ...p, 
                                    description: template.description, 
                                    requirements: template.requirements, 
                                    constraints: template.constraints, 
                                    customConcept: ''
                                }));
                                setHasInteracted({ requirements: false, constraints: false });
                            }}
                            className={`w-full text-left p-4 rounded-lg border-2 bg-gray-50 dark:bg-charcoal-800/50 shadow-sm transition-all ${selectedTemplateName === template.name ? 'border-brand-primary ring-2 ring-brand-primary' : 'border-transparent hover:border-brand-primary/50'}`}
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
                 {selectedTemplateName === 'Custom Template' && (
                    <div className="mt-4 p-4 border-t dark:border-charcoal-700">
                        <label htmlFor="customConcept" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Custom Project Concept</label>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Enter a high-level or cryptic concept for the AI to expand upon.</p>
                        <textarea 
                            id="customConcept" 
                            rows={4}
                            value={projectData.customConcept}
                            onChange={e => setProjectData(p => ({...p, customConcept: e.target.value}))}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-charcoal-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                            placeholder="e.g., 'A decentralized network for real-time environmental monitoring using IoT sensors and blockchain for data integrity.'"
                        />
                    </div>
                )}
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
          {step === 4 && (
             <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Compliance Standards (Optional)</label>
               <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Select any regulatory standards that apply to this project. This will guide the AI in generating compliant documentation.</p>
              <div className="mt-2 flex items-center border border-gray-300 rounded-md px-3 dark:border-gray-600">
                <Search className="w-5 h-5 text-gray-400" />
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full py-2 px-2 border-0 focus:ring-0 sm:text-sm bg-transparent dark:text-white dark:placeholder-gray-400" placeholder="Search standards..." />
              </div>
              <div className="mt-2 max-h-48 overflow-y-auto border rounded-md p-2 flex flex-wrap gap-2 dark:border-gray-600">
                {filteredStandards.map(s => (
                  <button key={s} onClick={() => handleStandardToggle(s)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${projectData.complianceStandards.includes(s) ? 'bg-brand-secondary text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-charcoal-700 dark:text-gray-300 dark:hover:bg-charcoal-600'}`}>
                    <Shield className="inline mr-2 w-4 h-4" />{s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {step === 5 && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project Requirements</label>
                <Button variant="outline" size="sm" onClick={() => handleGenerateDoc('requirements')} disabled={isGenerating !== null}>
                    {isGenerating === 'requirements' ? <LoaderCircle className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Generate with AI
                </Button>
              </div>
              <textarea id="requirements" rows={5} value={projectData.requirements} 
                onFocus={() => setHasInteracted(p => ({ ...p, requirements: true }))}
                onChange={e => {
                    setProjectData(p => ({ ...p, requirements: e.target.value }));
                    setHasInteracted(p => ({ ...p, requirements: true }));
                }} 
                className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-charcoal-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white ${!hasInteracted.requirements ? 'text-gray-400 dark:text-gray-500' : ''}`} placeholder="Click 'Generate with AI' or manually define the core objectives, functionalities, and performance criteria." />
              <div className="mt-6">
                <TuningControls
                  settings={requirementsTuning}
                  onChangeSettings={setRequirementsTuning}
                  title="Tune Requirements Generation"
                  description="Adjust parameters to guide the AI for requirements generation."
                />
              </div>
            </div>
          )}
          {step === 6 && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="constraints" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project Constraints</label>
                 <Button variant="outline" size="sm" onClick={() => handleGenerateDoc('constraints')} disabled={isGenerating !== null}>
                    {isGenerating === 'constraints' ? <LoaderCircle className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Generate with AI
                </Button>
            </div>
              <textarea id="constraints" rows={8} value={projectData.constraints} 
                onFocus={() => setHasInteracted(p => ({ ...p, constraints: true }))}
                onChange={e => {
                  setProjectData(p => ({ ...p, constraints: e.target.value }));
                  setHasInteracted(p => ({ ...p, constraints: true }));
                }}
                className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-charcoal-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white ${!hasInteracted.constraints ? 'text-gray-400 dark:text-gray-500' : ''}`} placeholder="Click 'Generate with AI' or manually list any limitations, such as budget, timeline, regulations, or available technologies." />
            </div>
          )}
          {step === 7 && (
              <div className="text-center py-12">
                  <LoaderCircle className="w-12 h-12 mx-auto text-brand-primary animate-spin" />
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Tailoring project lifecycle with AI...</p>
              </div>
          )}
        </div>
        {step < 7 && (
            <div className="flex justify-between mt-8 p-6 pt-0 -m-6 mb-0">
              <Button variant="outline" onClick={step === 1 ? onCancel : prevStep}>{step === 1 ? 'Cancel' : 'Back'}</Button>
              <Button 
                onClick={step === 6 ? createProject : nextStep} 
                disabled={
                    (step === 1 && (!selectedTemplateName || (selectedTemplateName === 'Custom Template' && !projectData.customConcept.trim()))) ||
                    (step === 2 && !projectData.name.trim()) || 
                    (step === 3 && projectData.disciplines.length === 0) ||
                    (step === 5 && !projectData.requirements.trim()) ||
                    (step === 6 && !projectData.constraints.trim())
                }
              >
                {step === 6 ? 'Create Project' : 'Next'}
              </Button>
            </div>
        )}
      </Card>
    </div>
  );
};