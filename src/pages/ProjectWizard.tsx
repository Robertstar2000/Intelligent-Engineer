
import React, { useState } from 'react';
import { CheckCircle, Plus, Search, LoaderCircle, Shield, Sparkles } from 'lucide-react';
import { Button, Card, ProgressBar } from '../components/ui';
import { TuningControls } from '../components/TuningControls';
import { ApiKeyWarning } from '../components/ApiKeyWarning';
import { useProject } from '../context/ProjectContext';
import { Project, Phase, ToastMessage } from '../types';
import { ENGINEERING_DISCIPLINES, COMPLIANCE_STANDARDS } from '../constants';
import { generateTailoredPhaseDescriptions, generateInitialProjectDocs } from '../services/geminiService';

interface ProjectWizardProps {
  onProjectCreated: (project: Project) => void;
  onCancel: () => void;
  setToast: (toast: ToastMessage) => void;
}

export const ProjectWizard = ({ onProjectCreated, onCancel, setToast }: ProjectWizardProps) => {
  const { currentUser, addProject } = useProject();
  const [step, setStep] = useState(1);
  const [projectData, setProjectData] = useState({ name: '', description: '', requirements: '', constraints: '', disciplines: [] as string[], complianceStandards: [] as string[], customConcept: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [developmentMode, setDevelopmentMode] = useState<'full' | 'rapid'>('full');
  const [isGenerating, setIsGenerating] = useState<'requirements' | 'constraints' | null>(null);
  
  // Initialize with a broad set of defaults so sliders are visible immediately
  const [requirementsTuning, setRequirementsTuning] = useState({ 
      clarity: 70, 
      technicality: 60, 
      userCentricity: 75,
      creativity: 60,
      riskAversion: 50,
      costOptimization: 50,
      foresight: 60
  });

  const filteredDisciplines = ENGINEERING_DISCIPLINES.filter(d => d.toLowerCase().includes(searchTerm.toLowerCase()));
  const handleDisciplineToggle = (discipline: string) => setProjectData(prev => ({ ...prev, disciplines: prev.disciplines.includes(discipline) ? prev.disciplines.filter(d => d !== discipline) : prev.disciplines.length < 3 ? [...prev.disciplines, discipline] : prev.disciplines }));
  
  const handleStandardToggle = (standard: string) => setProjectData(prev => ({ ...prev, complianceStandards: prev.complianceStandards.includes(standard) ? prev.complianceStandards.filter(s => s !== standard) : [...prev.complianceStandards, standard] }));

  const handleGenerateDoc = async (docType: 'requirements' | 'constraints') => {
        if (!process.env.API_KEY) {
            setToast({ message: "API Key is missing. Cannot generate content.", type: 'error' });
            return;
        }
        setIsGenerating(docType);
        try {
            const result = await generateInitialProjectDocs(projectData, docType, requirementsTuning);
            setProjectData(p => ({ ...p, [docType]: result }));
            setToast({ message: `${docType === 'requirements' ? 'Requirements' : 'Constraints'} generated successfully.`, type: 'success' });
        } catch (err: any) {
            console.error(err);
            setToast({ message: `Failed to generate ${docType}: ${err.message}`, type: 'error' });
        } finally {
            setIsGenerating(null);
        }
    };

  const createProject = async () => {
    if (!currentUser) return;
    setStep(7);
    const basePhasesData = [
        { name: 'Feasibility Study', description: 'Analyze technical, economic, and strategic viability.', sprints: [], tuningSettings: { technicalFeasibility: 90, economicViability: 70 }, isEditable: true, designReview: { required: false, checklist: [] } },
        { name: 'Requirements', description: 'Define functional objectives.', sprints: [{ id: 'req-1', name: 'Project Scope', description: 'A high-level document.' }], tuningSettings: requirementsTuning, isEditable: true, designReview: { required: false, checklist: [] } },
        { name: 'Preliminary Design', description: 'Concepts and trade studies.', sprints: [], tuningSettings: { creativity: 80 }, isEditable: true, designReview: { required: true, checklist: [] } },
        { name: 'Critical Design', description: 'Detailed specs.', sprints: [], tuningSettings: { technicalDepth: 90 }, isEditable: true, designReview: { required: true, checklist: [] } },
        { name: 'Testing', description: 'Verification and Validation.', sprints: [], tuningSettings: { coverage: 90 }, isEditable: true, designReview: { required: false, checklist: [] } },
        { name: 'Launch', description: 'Strategy formulation.', sprints: [], tuningSettings: { phasedRollout: 70 }, isEditable: true, designReview: { required: false, checklist: [] } },
        { name: 'Operation', description: 'Ops and maintenance.', sprints: [], tuningSettings: { monitoring: 90 }, isEditable: true, designReview: { required: false, checklist: [] } },
        { name: 'Improvement', description: 'Future enhancements.', sprints: [], tuningSettings: { userFeedback: 80 }, isEditable: true, designReview: { required: false, checklist: [] } }
    ];
    
    let tailoredDescriptions: any = {};
    try {
        if (process.env.API_KEY) {
            tailoredDescriptions = await generateTailoredPhaseDescriptions(projectData.disciplines, basePhasesData);
        }
    } catch (e) {
        console.warn("Failed to tailor descriptions", e);
    }

    const finalPhases: Phase[] = basePhasesData.map(p => ({
        id: crypto.randomUUID(),
        name: p.name,
        description: tailoredDescriptions[p.name] || p.description,
        status: 'not-started',
        outputs: [],
        sprints: (p.sprints || []).map(s => ({ ...s, id: crypto.randomUUID(), status: 'not-started', deliverables: [], outputs: [] })),
        tuningSettings: p.tuningSettings,
        isEditable: p.isEditable,
        designReview: p.designReview,
    }));

    const newProject: Project = { id: crypto.randomUUID(), userId: currentUser.id, ...projectData, templateName: 'Manual Selection', developmentMode, currentPhase: 0, createdAt: new Date(), automationMode: 'hmap', phases: finalPhases, users: [currentUser], comments: {} };
    addProject(newProject);
    onProjectCreated(newProject);
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);
  const titles = ['Concept', 'Identity', 'Disciplines', 'Compliance', 'Requirements', 'Constraints', 'Finalizing...'];

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center z-50 overflow-y-auto p-4 sm:p-10">
      <Card className="w-full max-w-2xl transform transition-all flex flex-col h-fit" title="Create New Engineering Project" description={`Step ${step} of 7: ${titles[step - 1]}`}>
        <div className="space-y-6 flex-grow p-6 -m-6 mt-0">
          <ProgressBar progress={(step / 7) * 100} />
          {step === 1 && (
            <div>
              <label htmlFor="customConcept" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Custom Project Concept</label>
              <textarea 
                  id="customConcept" 
                  rows={6}
                  value={projectData.customConcept}
                  onChange={e => setProjectData(p => ({...p, customConcept: e.target.value}))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand-primary dark:bg-charcoal-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter a high-level or cryptic concept. The AI will use this to flesh out requirements."
              />
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Project Name</label>
                <input type="text" value={projectData.name} onChange={e => setProjectData(p => ({ ...p, name: e.target.value }))} className="mt-1 block w-full border rounded-md p-2 dark:bg-charcoal-700 dark:text-white" placeholder="e.g. Autonomous Drone" />
              </div>
              <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea 
                    value={projectData.description} 
                    onChange={e => setProjectData(p => ({ ...p, description: e.target.value }))} 
                    rows={3} 
                    className="mt-1 block w-full border rounded-md p-2 dark:bg-charcoal-700 dark:text-white" 
                    placeholder="A general-purpose template for physical products following a V-model lifecycle."
                />
              </div>
            </div>
          )}
          {step === 3 && (
            <div>
              <label className="block text-sm font-medium">Engineering Disciplines (up to 3)</label>
              <div className="mt-2 flex flex-wrap gap-2 max-h-[40vh] overflow-y-auto border rounded p-2 dark:border-gray-600">
                {filteredDisciplines.map(d => (
                  <button key={d} onClick={() => handleDisciplineToggle(d)} className={`px-3 py-1 text-xs rounded-full ${projectData.disciplines.includes(d) ? 'bg-brand-primary text-charcoal-900' : 'bg-gray-200 dark:bg-charcoal-700'}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}
          {step === 4 && (
            <div>
              <label className="block text-sm font-medium">Compliance Standards</label>
              <div className="mt-2 flex flex-wrap gap-2 max-h-[40vh] overflow-y-auto border rounded p-2 dark:border-gray-600">
                {COMPLIANCE_STANDARDS.map(s => (
                  <button key={s} onClick={() => handleStandardToggle(s)} className={`px-3 py-1 text-xs rounded-full text-left ${projectData.complianceStandards.includes(s) ? 'bg-brand-primary text-charcoal-900' : 'bg-gray-200 dark:bg-charcoal-700'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {step === 5 && (
            <div className="space-y-6">
                {!process.env.API_KEY && <ApiKeyWarning />}
                
                <TuningControls
                    settings={requirementsTuning}
                    onChangeSettings={setRequirementsTuning}
                    title="AI Tuning: Requirements Generation"
                    description="Adjust how the AI should draft your initial requirements."
                />

                <div className="space-y-4 pt-4 border-t dark:border-charcoal-700">
                    <div className="flex justify-between items-end">
                        <label className="block text-sm font-medium">Requirements Draft</label>
                        <Button variant="outline" size="sm" onClick={() => handleGenerateDoc('requirements')} disabled={!!isGenerating || !process.env.API_KEY}>
                        {isGenerating === 'requirements' ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />} Generate with AI
                        </Button>
                    </div>
                    <textarea 
                        rows={8} 
                        value={projectData.requirements} 
                        onChange={e => setProjectData(p => ({ ...p, requirements: e.target.value }))} 
                        className="mt-1 block w-full border rounded-md p-2 dark:bg-charcoal-700 dark:text-white font-mono text-sm"
                        placeholder="The system shall [main function], achieve performance of [key metric] and operate within [operating conditions]."
                    />
                </div>
            </div>
          )}
          {step === 6 && (
            <div className="space-y-4">
              {!process.env.API_KEY && <ApiKeyWarning />}
              <div className="flex justify-between">
                <label className="block text-sm font-medium">Constraints</label>
                <Button variant="outline" size="sm" onClick={() => handleGenerateDoc('constraints')} disabled={!!isGenerating || !process.env.API_KEY}>
                  {isGenerating === 'constraints' ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />} Generate with AI
                </Button>
              </div>
              <textarea 
                rows={8} 
                value={projectData.constraints} 
                onChange={e => setProjectData(p => ({ ...p, constraints: e.target.value }))} 
                className="mt-1 block w-full border rounded-md p-2 dark:bg-charcoal-700 dark:text-white font-mono text-sm"
                placeholder="e.g. Total cost must not exceed $5,000. Project must be completed by December 2025."
              />
            </div>
          )}
          {step === 7 && <div className="text-center py-12"><LoaderCircle className="w-12 h-12 mx-auto text-brand-primary animate-spin" /><p className="mt-4">Tailoring project lifecycle...</p></div>}
        </div>
        {step < 7 && (
            <div className="flex justify-between mt-8 p-6 pt-0 -m-6">
              <Button variant="outline" onClick={step === 1 ? onCancel : prevStep}>{step === 1 ? 'Cancel' : 'Back'}</Button>
              <Button onClick={step === 6 ? createProject : nextStep}>Next</Button>
            </div>
        )}
      </Card>
    </div>
  );
};
