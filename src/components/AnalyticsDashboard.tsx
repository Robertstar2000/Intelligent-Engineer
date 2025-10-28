import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ArrowRight, Home, Zap, LoaderCircle, Lightbulb } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { Button, Card, Badge, ProgressBar } from './ui';
import { ProjectHeader } from './ProjectHeader';
import { AnalyticsMetrics, Recommendation } from '../types';
import { calculateProjectMetrics } from '../services/analyticsEngine';
import { generateProjectRecommendations } from '../services/geminiService';

// FIX: Added explicit props type for MetricCard to fix type inference errors when props are optional.
interface MetricCardProps {
    title: string;
    value: string | number;
    unit?: string;
    children?: React.ReactNode;
}

const MetricCard = ({ title, value, unit = '', children }: MetricCardProps) => (
    <Card>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
            {value}
            <span className="text-xl font-medium text-gray-500 dark:text-gray-400 ml-1">{unit}</span>
        </p>
        {children}
    </Card>
);

const BenchmarkCard = ({ title, userValue, benchmarkValue, unit = '' }) => {
    const isAboveBenchmark = userValue >= benchmarkValue;
    const difference = Math.abs(userValue - benchmarkValue).toFixed(1);

    return (
        <Card>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <div className="flex items-baseline mt-1">
                <p className="text-3xl font-semibold text-gray-900 dark:text-white">
                    {userValue}
                    <span className="text-xl font-medium text-gray-500 dark:text-gray-400 ml-1">{unit}</span>
                </p>
                <p className={`ml-2 flex items-baseline text-sm font-semibold ${isAboveBenchmark ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {isAboveBenchmark ? <TrendingUp className="h-5 w-5 flex-shrink-0 self-center" /> : <TrendingDown className="h-5 w-5 flex-shrink-0 self-center" />}
                    <span className="sr-only">{isAboveBenchmark ? 'Increased' : 'Decreased'} by</span>
                    {difference} {unit}
                </p>
            </div>
             <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Industry Benchmark: {benchmarkValue} {unit}</p>
        </Card>
    );
};

export const AnalyticsDashboard = ({ onBack }) => {
    const { project, setProject, theme, setTheme } = useProject();
    const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
    const [isLoadingRecs, setIsLoadingRecs] = useState(false);

    useEffect(() => {
        if (project) {
            const calculatedMetrics = calculateProjectMetrics(project);
            setMetrics(calculatedMetrics);
        }
    }, [project]);

    const handleGenerateRecommendations = async () => {
        if (!project || !metrics) return;
        setIsLoadingRecs(true);
        try {
            const recommendations = await generateProjectRecommendations(project, metrics);
            setProject(p => p ? { ...p, recommendations } : null);
        } catch (error) {
            // silent error
        } finally {
            setIsLoadingRecs(false);
        }
    };

    if (!project || !metrics) {
        return <div>Loading analytics...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
             <ProjectHeader
                onGoHome={onBack}
                theme={theme}
                setTheme={setTheme}
                showBackButton
            />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Project Analytics Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <MetricCard title="Overall Progress" value={metrics.completionRate.toFixed(0)} unit="%">
                    <ProgressBar progress={metrics.completionRate} className="mt-2" />
                </MetricCard>
                <MetricCard title="Sprint Completion" value={metrics.sprintCompletionRate.toFixed(0)} unit="%">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{metrics.completedSprints} of {metrics.totalSprints} sprints completed</p>
                </MetricCard>
                <MetricCard title="Time Elapsed" value={metrics.timeElapsedDays} unit="days" />
                <MetricCard title="Current Phase" value={metrics.currentPhaseName}>
                     <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {Object.entries(metrics.phaseStatusCounts).map(([status, count]) => `${count} ${status}`).join(', ')}
                    </p>
                </MetricCard>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card title="AI-Powered Recommendations" description="Actionable insights to improve project performance.">
                        {project.recommendations && project.recommendations.length > 0 ? (
                            <div className="space-y-4">
                                {project.recommendations.map(rec => (
                                    <div key={rec.id} className="p-3 bg-gray-50 dark:bg-charcoal-800/50 rounded-lg">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-semibold text-gray-900 dark:text-white flex-1">{rec.title}</h4>
                                            <Badge variant="info" className="ml-2">{rec.category}</Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{rec.description}</p>
                                        <div className="mt-3 pt-3 border-t dark:border-charcoal-700 flex items-start space-x-2">
                                            <ArrowRight className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{rec.actionableStep}</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="flex justify-end pt-2">
                                     <Button onClick={handleGenerateRecommendations} disabled={isLoadingRecs} variant="outline" size="sm">
                                        {isLoadingRecs ? <LoaderCircle className="mr-2 w-4 h-4 animate-spin"/> : <Zap className="mr-2 w-4 h-4"/>}
                                        Regenerate
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Lightbulb className="w-12 h-12 text-brand-yellow mx-auto" />
                                <p className="text-gray-600 dark:text-gray-400 my-4">Generate AI recommendations for best practices, process improvements, and risk mitigation.</p>
                                <Button onClick={handleGenerateRecommendations} disabled={isLoadingRecs}>
                                    {isLoadingRecs ? <LoaderCircle className="mr-2 w-4 h-4 animate-spin"/> : <Zap className="mr-2 w-4 h-4"/>}
                                    Generate Recommendations
                                </Button>
                            </div>
                        )}
                    </Card>
                </div>
                <div className="space-y-6">
                     <Card title="Comparative Analytics" description="How your project stacks up against industry benchmarks.">
                        <div className="space-y-4">
                            <BenchmarkCard title="Sprint Velocity" userValue={metrics.industryBenchmarks.sprintVelocity.value} benchmarkValue={metrics.industryBenchmarks.sprintVelocity.benchmark} unit="sprints/wk" />
                            <BenchmarkCard title="Design Review Time" userValue={metrics.industryBenchmarks.designReviewEfficiency.value} benchmarkValue={metrics.industryBenchmarks.designReviewEfficiency.benchmark} unit="days" />
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};