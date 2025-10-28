import { Project, Phase, AnalyticsMetrics } from '../types';

export const calculateProjectMetrics = (project: Project): AnalyticsMetrics => {
    const { phases, createdAt } = project;

    const completedPhases = phases.filter(p => p.status === 'completed').length;
    const completionRate = (completedPhases / phases.length) * 100;

    let totalSprints = 0;
    let completedSprints = 0;
    phases.forEach(phase => {
        totalSprints += phase.sprints.length;
        completedSprints += phase.sprints.filter(s => s.status === 'completed').length;
    });

    const sprintCompletionRate = totalSprints > 0 ? (completedSprints / totalSprints) * 100 : 0;

    const timeElapsedMs = new Date().getTime() - new Date(createdAt).getTime();
    const timeElapsedDays = Math.max(1, Math.round(timeElapsedMs / (1000 * 60 * 60 * 24)));

    const firstIncompletePhase = phases.find(p => p.status !== 'completed');
    const currentPhaseName = firstIncompletePhase ? firstIncompletePhase.name : 'Completed';

    const phaseStatusCounts = phases.reduce((acc, phase) => {
        acc[phase.status] = (acc[phase.status] || 0) + 1;
        return acc;
    }, {} as { [key in Phase['status']]: number });

    // Mocked data for benchmarks
    const sprintsPerWeek = (completedSprints / timeElapsedDays) * 7;
    const industrySprintVelocityBenchmark = 3.5; // sprints per week

    // Mocking this metric
    const designReviewEfficiency = 1.2; // days per review
    const industryDesignReviewBenchmark = 2.0; // days
    
    return {
        completionRate,
        sprintCompletionRate,
        totalSprints,
        completedSprints,
        timeElapsedDays,
        currentPhaseName,
        phaseStatusCounts,
        industryBenchmarks: {
            sprintVelocity: { value: parseFloat(sprintsPerWeek.toFixed(1)), benchmark: industrySprintVelocityBenchmark },
            designReviewEfficiency: { value: designReviewEfficiency, benchmark: industryDesignReviewBenchmark },
        }
    };
};
