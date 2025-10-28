import React, { useState } from 'react';
import { Activity, LoaderCircle } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { Button, Card, Badge } from './ui';
import { assessProjectRisks } from '../services/geminiService';
import { Risk } from '../types';

export const RiskEnginePanel = () => {
    const { project, setProject } = useProject();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAssessRisks = async () => {
        if (!project) return;
        setIsLoading(true);
        setError(null);
        try {
            const risks = await assessProjectRisks(project);
            setProject({ ...project, risks });
        } catch (err: any) {
            setError(err.message || "Failed to assess risks.");
        } finally {
            setIsLoading(false);
        }
    };

    const getSeverityBadge = (severity: Risk['severity']) => {
        switch (severity) {
            case 'Critical': return <Badge variant="danger">{severity}</Badge>;
            case 'High': return <Badge variant="warning">{severity}</Badge>;
            case 'Medium': return <Badge variant="info">{severity}</Badge>;
            case 'Low': return <Badge variant="success">{severity}</Badge>;
            default: return <Badge>{severity}</Badge>;
        }
    };

    return (
        <Card title="AI Risk Assessment" description="Identify potential project risks based on all available documentation.">
            {!project?.risks || project.risks.length === 0 ? (
                <div className="text-center py-4">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">No risks assessed yet.</p>
                    <Button onClick={handleAssessRisks} disabled={isLoading}>
                        {isLoading ? (
                            <><LoaderCircle className="mr-2 w-4 h-4 animate-spin" /> Assessing...</>
                        ) : (
                            <><Activity className="mr-2 w-4 h-4" /> Assess Project Risks</>
                        )}
                    </Button>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>
            ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {project.risks.map(risk => (
                        <div key={risk.id} className="p-3 bg-gray-50 dark:bg-charcoal-800/50 rounded-lg">
                            <div className="flex justify-between items-start">
                                <h4 className="font-semibold text-gray-900 dark:text-white flex-1">{risk.title}</h4>
                                <div className="ml-2">{getSeverityBadge(risk.severity)}</div>
                            </div>
                            <Badge>{risk.category}</Badge>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{risk.description}</p>
                            <div className="mt-3 pt-3 border-t dark:border-charcoal-700">
                                <h5 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Mitigation</h5>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{risk.mitigation}</p>
                            </div>
                        </div>
                    ))}
                    <div className="flex justify-end pt-2">
                        <Button onClick={handleAssessRisks} disabled={isLoading} variant="outline" size="sm">
                           {isLoading ? (
                            <><LoaderCircle className="mr-2 w-4 h-4 animate-spin" /> Re-assessing...</>
                        ) : (
                            <><Activity className="mr-2 w-4 h-4" /> Re-assess Risks</>
                        )}
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    );
};