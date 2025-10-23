export interface Sprint {
    id: string;
    name: string;
    description: string;
    status: 'not-started' | 'in-progress' | 'completed';
    deliverables: string[];
    output?: string;
    assignedTo?: string;
    assignedRole?: DynamicRole;
    estimatedHours?: number;
    actualHours?: number;
    dependencies?: string[];
}
export interface TuningSettings {
    clarity?: number;
    technicality?: number;
    foresight?: number;
    riskAversion?: number;
    userCentricity?: number;
    conciseness?: number;
    creativity?: number;
    costOptimization?: number;
    performanceBias?: number;
    modularity?: number;
    technicalDepth?: number;
    failureAnalysis?: number;
    manufacturability?: number;
    standardsAdherence?: number;
    [key: string]: number | string | boolean | undefined;
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
    assignedUsers?: string[];
    collaborationSessions?: CollaborationSession[];
    versionHistory?: VersionHistory[];
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
    description?: string;
    organizationId?: string;
    templateId?: string;
    template?: Template;
    programScale?: ProgramScale;
    team: TeamMember[];
    dynamicRoles: DynamicRole[];
    programLeader?: string;
    complianceRequirements: ComplianceRequirement[];
    auditTrail: AuditEvent[];
    integrations: Integration[];
    cadConnections: CADConnection[];
    simulationConnections: SimulationConnection[];
    analytics?: ProjectAnalytics;
    riskAssessment?: RiskAssessment;
    updatedAt: Date;
    createdBy?: string;
    status: ProjectStatus;
}
export interface TeamMember {
    id: string;
    userId: string;
    projectId: string;
    role: DynamicRole;
    permissions: Permission[];
    joinedAt: Date;
    isActive: boolean;
    lastActivity?: Date;
    user?: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
    };
}
export interface DynamicRole {
    id: string;
    name: string;
    description: string;
    responsibilities: string[];
    deliverables: string[];
    approvalAuthorities: ApprovalAuthority[];
    permissions: Permission[];
    accessLevel: AccessLevel;
    discipline: string;
    projectScale: ProgramScale;
    organizationContext: OrganizationContext;
    reportsTo: string[];
    manages: string[];
    collaboratesWith: string[];
    generatedBy: 'template' | 'ai' | 'manual';
    templateSource: string;
    aiConfidence: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface Template {
    id: string;
    name: string;
    description: string;
    version: string;
    disciplines: string[];
    developmentMode: 'full' | 'rapid';
    phases: PhaseTemplate[];
    dynamicRoles: DynamicRole[];
    complianceFrameworks: string[];
    aiProfiles: AIProfile[];
    integrationRequirements: IntegrationRequirement[];
    isBuiltIn: boolean;
    isCustom: boolean;
    organizationId?: string;
    usage: TemplateUsage;
    createdAt: Date;
}
export interface CollaborationSession {
    id: string;
    projectId: string;
    documentId: string;
    sessionType: SessionType;
    activeUsers: ActiveUser[];
    invitedUsers: string[];
    permissions: SessionPermission[];
    document: Document;
    changes: Change[];
    conflicts: EditConflict[];
    cursors: CursorPosition[];
    selections: Selection[];
    annotations: Annotation[];
    startedAt: Date;
    lastActivity: Date;
    isActive: boolean;
    maxParticipants: number;
    recordingEnabled: boolean;
    changeHistory: ChangeHistory[];
    snapshots: SessionSnapshot[];
}
export type ProgramScale = 'small' | 'medium' | 'large' | 'enterprise';
export type ProjectStatus = 'draft' | 'active' | 'on-hold' | 'completed' | 'archived';
export type AccessLevel = 'read' | 'write' | 'admin' | 'owner';
export type SessionType = 'document' | 'whiteboard' | '3d-model' | 'video-call';
export interface Permission {
    id: string;
    name: string;
    resource: string;
    action: string;
    conditions?: Record<string, any>;
}
export interface ApprovalAuthority {
    id: string;
    name: string;
    scope: string;
    level: 'phase' | 'sprint' | 'document' | 'project';
}
export interface OrganizationContext {
    id: string;
    name: string;
    industry: string;
    size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
    complianceRequirements: string[];
    customTerminology: Record<string, string>;
}
export interface ComplianceRequirement {
    id: string;
    standard: string;
    version: string;
    applicableSections: string[];
    status: 'pending' | 'in-progress' | 'compliant' | 'non-compliant';
    lastAssessed: Date;
}
export interface AuditEvent {
    id: string;
    timestamp: Date;
    userId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    changes: ChangeRecord[];
    signature: CryptographicSignature;
    context: AuditContext;
}
export type IntegrationType = 'cad' | 'simulation' | 'eda' | 'project-management' | 'communication' | 'version-control' | 'cloud-storage' | 'ci-cd' | 'testing' | 'monitoring' | 'custom';
export type IntegrationStatus = 'pending' | 'connected' | 'disconnected' | 'error' | 'syncing';
export interface Integration {
    id: string;
    projectId: string;
    name: string;
    type: IntegrationType;
    provider: string;
    status: IntegrationStatus;
    configuration: IntegrationConfiguration;
    createdAt: Date;
    updatedAt: Date;
    lastSync: Date | null;
    health: IntegrationHealth;
    metrics: IntegrationMetrics;
}
export interface IntegrationConfiguration {
    enabled: boolean;
    autoSync?: boolean;
    syncInterval?: number;
    apiEndpoint?: string;
    webhookUrl?: string;
    retryAttempts?: number;
    timeout?: number;
    customSettings?: Record<string, any>;
}
export interface IntegrationCredentials {
    type: 'api-key' | 'oauth' | 'basic' | 'bearer' | 'custom';
    apiKey?: string;
    accessToken?: string;
    refreshToken?: string;
    tokenExpiry?: Date;
    username?: string;
    password?: string;
    clientId?: string;
    clientSecret?: string;
    privateKey?: string;
    certificate?: string;
    customFields?: Record<string, string>;
}
export interface IntegrationHealth {
    status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    lastCheck: Date;
    uptime: number;
    responseTime: number;
    errorRate: number;
    lastError: string | null;
}
export interface IntegrationMetrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    dataTransferred: number;
    lastActivity: Date;
}
export interface IntegrationLog {
    id: string;
    integrationId: string;
    level: 'info' | 'warning' | 'error';
    message: string;
    metadata?: any;
    timestamp: Date;
}
export interface IntegrationWebhook {
    id: string;
    integrationId: string;
    url: string;
    events: string[];
    secret: string;
    enabled: boolean;
    createdAt: Date;
    lastTriggered: Date | null;
    deliveryCount: number;
    failureCount: number;
}
export interface CustomIntegration {
    id: string;
    projectId: string;
    name: string;
    description: string;
    template: IntegrationTemplate;
    version: string;
    author: string;
    createdAt: Date;
    updatedAt: Date;
    isPublic: boolean;
    usageCount: number;
}
export interface IntegrationTemplate {
    name: string;
    description: string;
    type: IntegrationType;
    configurationSchema: Record<string, any>;
    credentialsSchema: Record<string, any>;
    endpoints: IntegrationEndpoint[];
    webhooks?: IntegrationWebhookConfig[];
    documentation?: string;
}
export interface IntegrationEndpoint {
    name: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    description: string;
    parameters?: IntegrationParameter[];
    requestBody?: Record<string, any>;
    responseSchema?: Record<string, any>;
}
export interface IntegrationParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required: boolean;
    description: string;
    default?: any;
}
export interface IntegrationWebhookConfig {
    event: string;
    description: string;
    payloadSchema: Record<string, any>;
}
export interface IntegrationError {
    code: string;
    message: string;
    details?: any;
    timestamp: Date;
    retryable: boolean;
}
export interface IntegrationWorkflow {
    id: string;
    projectId: string;
    name: string;
    description: string;
    steps: WorkflowStep[];
    triggers: WorkflowTrigger[];
    integrationIds: string[];
    status: 'active' | 'paused' | 'completed' | 'failed';
    createdAt: Date;
    updatedAt: Date;
    lastExecuted: Date | null;
    executionCount: number;
    successCount: number;
    failureCount: number;
}
export interface DataPipeline {
    id: string;
    projectId: string;
    name: string;
    description: string;
    sourceIntegrationId: string;
    targetIntegrationId: string;
    stages: PipelineStage[];
    schedule?: string;
    status: 'active' | 'paused' | 'failed';
    createdAt: Date;
    updatedAt: Date;
    lastExecuted: Date | null;
    executionCount: number;
    successCount: number;
    failureCount: number;
    dataProcessed: number;
}
export interface PipelineStage {
    id: string;
    name: string;
    type: 'extract' | 'transform' | 'load' | 'validate' | 'enrich';
    order: number;
    transformations: DataTransformation[];
    status: 'pending' | 'running' | 'completed' | 'failed';
}
export interface DataTransformation {
    type: 'filter' | 'map' | 'aggregate' | 'sort' | 'join' | 'custom';
    condition?: any;
    mapping?: Record<string, string>;
    aggregation?: {
        operation: 'sum' | 'avg' | 'count' | 'min' | 'max';
        field: string;
    };
    field?: string;
    order?: 'asc' | 'desc';
    customFunction?: string;
}
export interface PipelineExecution {
    id: string;
    pipelineId: string;
    status: 'running' | 'completed' | 'failed';
    startTime: Date;
    endTime: Date | null;
    stages: PipelineStageExecution[];
    recordsProcessed: number;
    recordsFailed: number;
    dataSize: number;
    error: string | null;
}
export interface PipelineStageExecution {
    stageId: string;
    status: 'running' | 'completed' | 'failed';
    startTime: Date;
    endTime: Date;
    recordsProcessed: number;
    error: string | null;
}
export interface ConnectorDefinition {
    id: string;
    name: string;
    description: string;
    type: 'source' | 'target' | 'bidirectional';
    version: string;
    configuration: Record<string, any>;
    methods: {
        connect: string;
        disconnect: string;
        read?: string;
        write?: string;
        validate: string;
    };
    createdAt: Date;
    updatedAt: Date;
    author: string;
    isPublic: boolean;
}
export interface ConnectorInstance {
    id: string;
    connectorId: string;
    projectId: string;
    integrationId: string;
    configuration: Record<string, any>;
    status: 'active' | 'inactive' | 'error';
    createdAt: Date;
    updatedAt: Date;
    lastUsed: Date | null;
    usageCount: number;
}
export interface IntegrationAnalytics {
    projectId: string;
    integrationId?: string;
    period: {
        start: Date;
        end: Date;
    };
    workflowStats: {
        totalWorkflows: number;
        activeWorkflows: number;
        totalExecutions: number;
        successfulExecutions: number;
        failedExecutions: number;
        averageExecutionTime: number;
    };
    pipelineStats: {
        totalPipelines: number;
        activePipelines: number;
        totalExecutions: number;
        successfulExecutions: number;
        failedExecutions: number;
        recordsProcessed: number;
    };
    performanceTrends: PerformanceTrend[];
    topErrors: ErrorSummary[];
    recommendations: string[];
}
export interface PerformanceTrend {
    timestamp: Date;
    metric: string;
    value: number;
}
export interface ErrorSummary {
    error: string;
    count: number;
    lastOccurrence: Date;
}
export interface PerformanceMetrics {
    integrationId: string;
    period: {
        start: Date;
        end: Date;
    };
    requestMetrics: {
        totalRequests: number;
        successfulRequests: number;
        failedRequests: number;
        averageResponseTime: number;
        p95ResponseTime: number;
        p99ResponseTime: number;
    };
    workflowMetrics: {
        totalExecutions: number;
        successfulExecutions: number;
        failedExecutions: number;
        averageExecutionTime: number;
    };
    pipelineMetrics: {
        totalExecutions: number;
        successfulExecutions: number;
        failedExecutions: number;
        recordsProcessed: number;
        averageProcessingTime: number;
    };
    errorMetrics: {
        totalErrors: number;
        errorRate: number;
        topErrors: ErrorSummary[];
    };
    resourceMetrics: {
        cpuUsage: number;
        memoryUsage: number;
        networkBandwidth: number;
    };
}
export interface IntegrationAlert {
    id: string;
    integrationId: string;
    type: 'error' | 'performance' | 'health' | 'usage';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    metadata?: any;
    status: 'active' | 'acknowledged' | 'resolved';
    createdAt: Date;
    acknowledgedAt: Date | null;
    acknowledgedBy: string | null;
    resolvedAt: Date | null;
    resolvedBy: string | null;
}
export type ExportFormat = 'pdf' | 'word' | 'powerpoint' | 'markdown' | 'zip' | 'json' | 'html';
export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed';
export interface ExportRequest {
    id: string;
    projectId: string;
    format: ExportFormat;
    options: ExportOptions;
    userId: string;
    status: ExportStatus;
    createdAt: Date;
    startedAt: Date | null;
    completedAt: Date | null;
    progress: number;
    error: string | null;
}
export interface ExportOptions {
    templateId?: string;
    includePhases?: string[];
    includeDocuments?: string[];
    includeSprints?: boolean;
    includeTeam?: boolean;
    includeAnalytics?: boolean;
    branding?: ExportBranding;
    formatting?: ExportFormatting;
    customFields?: Record<string, any>;
}
export interface ExportBranding {
    organizationName?: string;
    logo?: string;
    colors?: {
        primary?: string;
        secondary?: string;
        accent?: string;
    };
    fonts?: {
        heading?: string;
        body?: string;
    };
    footer?: string;
    watermark?: string;
}
export interface ExportFormatting {
    pageSize?: 'A4' | 'Letter' | 'Legal';
    orientation?: 'portrait' | 'landscape';
    margins?: {
        top?: number;
        right?: number;
        bottom?: number;
        left?: number;
    };
    fontSize?: number;
    lineSpacing?: number;
    includeTableOfContents?: boolean;
    includePageNumbers?: boolean;
    includeHeader?: boolean;
    includeFooter?: boolean;
}
export interface ExportResult {
    id: string;
    projectId: string;
    format: ExportFormat;
    status: ExportStatus;
    filePath: string | null;
    fileName: string | null;
    fileSize: number;
    downloadUrl: string | null;
    createdAt: Date;
    expiresAt: Date | null;
    error: string | null;
}
export interface ExportTemplate {
    id: string;
    name: string;
    description: string;
    format: ExportFormat;
    configuration: ExportTemplateConfiguration;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    isPublic: boolean;
    usageCount: number;
}
export interface ExportTemplateConfiguration {
    branding?: ExportBranding;
    formatting?: ExportFormatting;
    filters?: {
        includePhases?: string[];
        includeDocumentTypes?: string[];
        includeStatus?: string[];
    };
    sections?: ExportSection[];
    customization?: Record<string, any>;
}
export interface ExportSection {
    id: string;
    name: string;
    type: 'cover' | 'toc' | 'summary' | 'content' | 'appendix' | 'custom';
    order: number;
    enabled: boolean;
    configuration?: Record<string, any>;
}
export interface DocumentExport {
    id: string;
    projectId: string;
    title: string;
    content: string;
    type: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface ProjectExport {
    id: string;
    name: string;
    description: string;
    discipline: string;
    phases: PhaseExport[];
    team: TeamMemberExport[];
    metadata: ProjectMetadata;
}
export interface PhaseExport {
    id: string;
    name: string;
    status: string;
    documents: DocumentExport[];
    sprints: SprintExport[];
    completedAt: Date | null;
}
export interface SprintExport {
    id: string;
    name: string;
    description: string;
    status: string;
    deliverables: string[];
}
export interface TeamMemberExport {
    id: string;
    name: string;
    email: string;
    role: string;
}
export interface ProjectMetadata {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}
export type StakeholderType = 'executive' | 'technical' | 'client' | 'team' | 'investor';
export interface PresentationExport {
    id: string;
    projectId: string;
    title: string;
    stakeholderType: StakeholderType;
    slides: PresentationSlide[];
    template: PresentationTemplate;
    createdBy: string;
    createdAt: Date;
}
export interface PresentationSlide {
    id: string;
    order: number;
    layout: string;
    title: string;
    subtitle?: string;
    content: Record<string, any>;
    notes?: string;
    animations?: SlideAnimation[];
}
export interface SlideAnimation {
    type: 'fade' | 'slide' | 'zoom' | 'custom';
    duration: number;
    delay: number;
}
export interface PresentationTemplate {
    id: string;
    name: string;
    description: string;
    stakeholderType: StakeholderType;
    configuration: PresentationTemplateConfiguration;
    slideLayouts: string[];
    branding: PresentationBranding;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    isPublic: boolean;
    usageCount: number;
}
export interface PresentationTemplateConfiguration {
    focusAreas?: string[];
    detailLevel?: 'high-level' | 'moderate' | 'detailed';
    includeCharts?: boolean;
    includeImages?: boolean;
    includeTables?: boolean;
    branding?: PresentationBranding;
    customization?: Record<string, any>;
}
export interface PresentationBranding {
    organizationName?: string;
    logo?: string;
    colors?: {
        primary?: string;
        secondary?: string;
        accent?: string;
        background?: string;
        text?: string;
    };
    fonts?: {
        heading?: string;
        body?: string;
        size?: {
            title?: number;
            heading?: number;
            body?: number;
        };
    };
    footer?: string;
    slideNumbers?: boolean;
}
export interface PresentationOptions {
    title?: string;
    templateId?: string;
    stakeholderType?: StakeholderType;
    includeExecutiveSummary?: boolean;
    includeMetrics?: boolean;
    includeTimeline?: boolean;
    includeRisks?: boolean;
    includeTeam?: boolean;
    includeClosing?: boolean;
    branding?: PresentationBranding;
    customSlides?: PresentationSlide[];
}
export type VibePromptType = 'code' | 'simulation' | 'testing' | 'documentation' | 'analysis';
export interface VibePrompt {
    id: string;
    projectId: string;
    type: VibePromptType;
    content: string;
    context: Record<string, any>;
    template: VibePromptTemplate;
    optimization?: PromptOptimization;
    createdBy: string;
    createdAt: Date;
}
export interface VibePromptTemplate {
    id: string;
    name: string;
    description: string;
    type: VibePromptType;
    configuration: Record<string, any>;
    sections: string[];
    variables: string[];
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    isPublic: boolean;
    usageCount: number;
}
export interface VibePromptOptions {
    templateId?: string;
    optimize?: boolean;
    includeContext?: boolean;
    includeExamples?: boolean;
    customVariables?: Record<string, any>;
}
export interface PromptOptimization {
    originalLength: number;
    optimizedLength: number;
    improvementPercentage: number;
    optimizations: string[];
}
export interface BatchExportJob {
    id: string;
    projectIds: string[];
    format: ExportFormat;
    options: ExportOptions;
    userId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    results: ExportResult[];
    createdAt: Date;
    startedAt: Date | null;
    completedAt: Date | null;
    error: string | null;
}
export interface ScheduledExport {
    id: string;
    projectId: string;
    format: ExportFormat;
    schedule: string;
    options: ExportOptions;
    distribution: {
        emails?: string[];
        webhooks?: string[];
        storage?: string;
    };
    userId: string;
    enabled: boolean;
    lastRun: Date | null;
    nextRun: Date;
    runCount: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface ExportAnalytics {
    projectId?: string;
    period: {
        start: Date;
        end: Date;
    };
    totalExports: number;
    exportsByFormat: Record<string, number>;
    exportsByUser: Record<string, number>;
    averageExportTime: number;
    totalDataExported: number;
    popularTemplates: Array<{
        templateId: string;
        usageCount: number;
    }>;
    trends: Array<{
        date: Date;
        count: number;
    }>;
}
export interface CustomExportFormat {
    id: string;
    name: string;
    description: string;
    configuration: Record<string, any>;
    transformer: string;
    validator: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    isPublic: boolean;
    usageCount: number;
}
export interface CADConnection {
    id: string;
    software: CADSoftware;
    projectId: string;
    syncedFiles: CADFile[];
    lastSync: Date;
    status: ConnectionStatus;
    configuration: CADConfiguration;
}
export interface SimulationConnection {
    id: string;
    software: SimulationSoftware;
    projectId: string;
    jobs: SimulationJob[];
    lastSync: Date;
    status: ConnectionStatus;
    configuration: SimulationConfiguration;
}
export interface ProjectAnalytics {
    projectId: string;
    metrics: ProjectMetrics;
    teamPerformance: TeamPerformanceMetrics;
    timeTracking: TimeTrackingData;
    progressTrends: ProgressTrendData[];
    generatedAt: Date;
}
export interface RiskAssessment {
    projectId: string;
    overallRiskScore: number;
    riskLevel: RiskLevel;
    risks: Risk[];
    mitigationPlans: MitigationPlan[];
    futureRisks: RiskPrediction[];
    trendAnalysis: RiskTrend[];
    recommendations: RiskRecommendation[];
    bestPractices: BestPractice[];
    assessmentDate: Date;
    confidence: number;
    modelVersion: string;
    dataQuality: DataQualityMetrics;
}
export interface ActiveUser {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: DynamicRole;
    isOnline: boolean;
    lastActivity: Date;
    currentLocation?: string;
}
export interface Change {
    id: string;
    sessionId: string;
    userId: string;
    type: ChangeType;
    operation: Operation;
    path: string;
    oldValue: any;
    newValue: any;
    timestamp: Date;
    sequenceNumber: number;
    dependencies: string[];
    conflictsWith: string[];
    resolution: ConflictResolution;
    clientId: string;
    deviceInfo: DeviceInfo;
    networkLatency: number;
}
export interface VersionHistory {
    id: string;
    version: string;
    timestamp: Date;
    userId: string;
    changes: Change[];
    message?: string;
    tags: string[];
}
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ChangeType = 'insert' | 'delete' | 'update' | 'move';
export type Operation = 'create' | 'read' | 'update' | 'delete';
export type ConflictResolution = 'auto' | 'manual' | 'pending';
export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'syncing';
export interface PhaseTemplate extends Omit<Phase, 'id' | 'status' | 'output'> {
    estimatedDuration: number;
    requiredRoles: string[];
    deliverableTemplates: DeliverableTemplate[];
}
export interface AIProfile {
    id: string;
    name: string;
    description: string;
    tuningSettings: TuningSettings;
    modelConfiguration: Record<string, any>;
    userId: string;
    organizationId?: string;
    isBuiltIn?: boolean;
    isShared: boolean;
    usage: ProfileUsage;
    createdAt: Date;
}
export interface ProfileUsage {
    timesUsed: number;
    lastUsed: Date;
    averageRating: number;
    feedback: string[];
}
export interface IntegrationRequirement {
    type: string;
    provider: string;
    required: boolean;
    configuration: Record<string, any>;
}
export interface TemplateUsage {
    timesUsed: number;
    lastUsed: Date;
    averageRating: number;
    feedback: string[];
}
export interface SessionPermission {
    userId: string;
    permissions: string[];
    grantedBy: string;
    grantedAt: Date;
}
export interface Document {
    id: string;
    content: string;
    format: 'markdown' | 'json' | 'text';
    version: string;
    lastModified: Date;
    modifiedBy: string;
}
export interface EditConflict {
    id: string;
    sessionId: string;
    conflictingChanges: Change[];
    detectedAt: Date;
    status: 'pending' | 'resolved' | 'ignored';
    resolution: ConflictResolution | null;
    resolvedBy?: string;
    resolvedAt?: Date;
}
export interface CursorPosition {
    userId: string;
    line: number;
    column: number;
    timestamp: Date;
    color?: string;
}
export interface Selection {
    userId: string;
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
    timestamp: Date;
    color?: string;
}
export interface Annotation {
    id: string;
    userId: string;
    type: 'comment' | 'highlight' | 'suggestion';
    content: string;
    position: {
        line: number;
        column: number;
    };
    createdAt: Date;
    resolvedAt?: Date;
    resolvedBy?: string;
}
export interface ChangeHistory {
    id: string;
    sessionId: string;
    changes: Change[];
    timestamp: Date;
    snapshot?: SessionSnapshot;
}
export interface SessionSnapshot {
    id: string;
    sessionId: string;
    documentState: Document;
    activeUsers: ActiveUser[];
    timestamp: Date;
    changeCount: number;
}
export interface ChangeRecord {
    field: string;
    oldValue: any;
    newValue: any;
    timestamp: Date;
}
export interface CryptographicSignature {
    algorithm: string;
    signature: string;
    publicKey: string;
    timestamp: Date;
}
export interface AuditContext {
    ipAddress: string;
    userAgent: string;
    sessionId: string;
    metadata: Record<string, any>;
}
export type CADSoftwareType = 'solidworks' | 'autocad' | 'fusion360' | 'inventor' | 'catia' | 'creo' | 'nx' | 'onshape';
export interface CADSoftware {
    type: CADSoftwareType;
    name: string;
    version: string;
    apiVersion: string;
    capabilities: CADCapability[];
    supportedFormats: string[];
}
export interface CADCapability {
    name: string;
    description: string;
    supported: boolean;
    requiresPlugin?: boolean;
}
export interface CADFile {
    id: string;
    name: string;
    path: string;
    format: string;
    size: number;
    version: string;
    checksum: string;
    metadata: CADFileMetadata;
    syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
    lastModified: Date;
    lastSynced: Date;
    localPath?: string;
    remotePath?: string;
}
export interface CADFileMetadata {
    author: string;
    createdDate: Date;
    modifiedDate: Date;
    partNumber?: string;
    revision?: string;
    description?: string;
    materials?: string[];
    dimensions?: {
        length: number;
        width: number;
        height: number;
        unit: string;
    };
    mass?: {
        value: number;
        unit: string;
    };
    customProperties: Record<string, any>;
}
export interface CADConfiguration {
    connectionId: string;
    software: CADSoftware;
    credentials: CADCredentials;
    syncSettings: CADSyncSettings;
    apiEndpoint?: string;
    webhookUrl?: string;
    pluginVersion?: string;
}
export interface CADCredentials {
    type: 'api-key' | 'oauth' | 'basic' | 'plugin';
    apiKey?: string;
    accessToken?: string;
    refreshToken?: string;
    username?: string;
    password?: string;
    expiresAt?: Date;
    scopes?: string[];
}
export interface CADSyncSettings {
    autoSync: boolean;
    syncInterval: number;
    syncDirection: 'bidirectional' | 'to-platform' | 'to-cad';
    conflictResolution: 'manual' | 'platform-wins' | 'cad-wins' | 'newest-wins';
    fileFilters: string[];
    excludePatterns: string[];
    versionControl: boolean;
    notifyOnSync: boolean;
}
export interface CADSyncResult {
    connectionId: string;
    syncId: string;
    startTime: Date;
    endTime: Date;
    status: 'success' | 'partial' | 'failed';
    filesProcessed: number;
    filesSucceeded: number;
    filesFailed: number;
    conflicts: CADSyncConflict[];
    errors: CADSyncError[];
    summary: string;
}
export interface CADSyncConflict {
    fileId: string;
    fileName: string;
    conflictType: 'version' | 'content' | 'metadata';
    platformVersion: string;
    cadVersion: string;
    platformModified: Date;
    cadModified: Date;
    resolution?: 'platform' | 'cad' | 'merge' | 'manual';
    resolvedAt?: Date;
    resolvedBy?: string;
}
export interface CADSyncError {
    fileId: string;
    fileName: string;
    errorType: 'connection' | 'permission' | 'format' | 'validation' | 'unknown';
    errorMessage: string;
    errorCode?: string;
    timestamp: Date;
    retryable: boolean;
}
export interface CADDesignData {
    fileId: string;
    extractedAt: Date;
    parts: CADPart[];
    assemblies: CADAssembly[];
    drawings: CADDrawing[];
    bom: BillOfMaterials;
    metadata: CADFileMetadata;
}
export interface CADPart {
    id: string;
    name: string;
    partNumber: string;
    revision: string;
    material: string;
    mass: number;
    volume: number;
    surfaceArea: number;
    dimensions: {
        length: number;
        width: number;
        height: number;
        unit: string;
    };
    features: CADFeature[];
    customProperties: Record<string, any>;
}
export interface CADAssembly {
    id: string;
    name: string;
    assemblyNumber: string;
    revision: string;
    components: CADComponent[];
    constraints: CADConstraint[];
    subAssemblies: CADAssembly[];
    totalMass: number;
    totalParts: number;
}
export interface CADComponent {
    id: string;
    partId: string;
    instanceName: string;
    quantity: number;
    position: {
        x: number;
        y: number;
        z: number;
    };
    rotation: {
        x: number;
        y: number;
        z: number;
    };
    isSuppressed: boolean;
}
export interface CADConstraint {
    id: string;
    type: 'mate' | 'angle' | 'distance' | 'parallel' | 'perpendicular' | 'concentric';
    component1: string;
    component2: string;
    value?: number;
    unit?: string;
}
export interface CADDrawing {
    id: string;
    name: string;
    drawingNumber: string;
    revision: string;
    sheets: CADSheet[];
    views: CADView[];
    dimensions: CADDimension[];
    annotations: CADAnnotation[];
}
export interface CADSheet {
    id: string;
    number: number;
    size: string;
    scale: number;
    title: string;
}
export interface CADView {
    id: string;
    name: string;
    type: 'front' | 'top' | 'side' | 'isometric' | 'section' | 'detail';
    scale: number;
    position: {
        x: number;
        y: number;
    };
}
export interface CADDimension {
    id: string;
    type: 'linear' | 'angular' | 'radial' | 'diameter';
    value: number;
    unit: string;
    tolerance?: {
        upper: number;
        lower: number;
    };
}
export interface CADAnnotation {
    id: string;
    type: 'note' | 'label' | 'symbol' | 'callout';
    text: string;
    position: {
        x: number;
        y: number;
    };
}
export interface CADFeature {
    id: string;
    type: 'extrude' | 'revolve' | 'sweep' | 'loft' | 'hole' | 'fillet' | 'chamfer' | 'pattern';
    name: string;
    parameters: Record<string, any>;
}
export interface BillOfMaterials {
    id: string;
    assemblyId: string;
    items: BOMItem[];
    generatedAt: Date;
    totalCost?: number;
    currency?: string;
}
export interface BOMItem {
    id: string;
    itemNumber: number;
    partNumber: string;
    description: string;
    quantity: number;
    material: string;
    unitCost?: number;
    totalCost?: number;
    supplier?: string;
    leadTime?: number;
    notes?: string;
}
export interface CADRequirementPush {
    id: string;
    connectionId: string;
    projectId: string;
    requirements: Requirements;
    targetFiles: string[];
    pushType: 'parameters' | 'constraints' | 'specifications' | 'full';
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    result?: CADRequirementPushResult;
    createdAt: Date;
    completedAt?: Date;
}
export interface CADRequirementPushResult {
    success: boolean;
    filesUpdated: string[];
    parametersSet: Record<string, any>;
    errors: string[];
    warnings: string[];
    summary: string;
}
export type EDASoftwareType = 'altium' | 'eagle' | 'kicad' | 'orcad' | 'proteus' | 'ltspice' | 'multisim' | 'easyeda' | 'circuitmaker' | 'diptrace';
export interface EDASoftware {
    type: EDASoftwareType;
    name: string;
    version: string;
    apiVersion: string;
    capabilities: EDACapability[];
    supportedFormats: string[];
}
export interface EDACapability {
    name: string;
    description: string;
    supported: boolean;
    requiresPlugin?: boolean;
}
export interface EDAConnection {
    id: string;
    software: EDASoftware;
    projectId: string;
    syncedFiles: EDAFile[];
    lastSync: Date;
    status: ConnectionStatus;
    configuration: EDAConfiguration;
}
export interface EDAFile {
    id: string;
    name: string;
    path: string;
    format: string;
    size: number;
    version: string;
    checksum: string;
    metadata: EDAFileMetadata;
    syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
    lastModified: Date;
    lastSynced: Date;
    localPath?: string;
    remotePath?: string;
}
export interface EDAFileMetadata {
    author: string;
    createdDate: Date;
    modifiedDate: Date;
    projectName?: string;
    revision?: string;
    description?: string;
    schematicType?: 'analog' | 'digital' | 'mixed' | 'power';
    boardLayers?: number;
    customProperties: Record<string, any>;
}
export interface EDAConfiguration {
    connectionId: string;
    software: EDASoftware;
    credentials: CADCredentials;
    syncSettings: CADSyncSettings;
    apiEndpoint?: string;
    webhookUrl?: string;
    pluginVersion?: string;
}
export interface EDADesignData {
    fileId: string;
    extractedAt: Date;
    schematic: SchematicData;
    pcbLayout?: PCBLayoutData;
    components: ComponentData[];
    netlist: NetlistData;
    bom: BillOfMaterials;
    metadata: EDAFileMetadata;
}
export interface SchematicData {
    id: string;
    name: string;
    sheets: SchematicSheet[];
    nets: Net[];
    buses: Bus[];
    hierarchicalBlocks: HierarchicalBlock[];
    annotations: SchematicAnnotation[];
}
export interface SchematicSheet {
    id: string;
    number: number;
    name: string;
    size: string;
    components: ComponentInstance[];
    wires: Wire[];
    labels: Label[];
    title: string;
    revision: string;
}
export interface ComponentInstance {
    id: string;
    designator: string;
    libraryReference: string;
    value: string;
    footprint?: string;
    position: {
        x: number;
        y: number;
    };
    rotation: number;
    properties: Record<string, any>;
}
export interface Wire {
    id: string;
    netName: string;
    points: Array<{
        x: number;
        y: number;
    }>;
    width: number;
}
export interface Net {
    id: string;
    name: string;
    nodes: NetNode[];
    class?: string;
}
export interface NetNode {
    componentId: string;
    pinNumber: string;
    pinName: string;
}
export interface Bus {
    id: string;
    name: string;
    members: string[];
}
export interface HierarchicalBlock {
    id: string;
    name: string;
    sheetReference: string;
    ports: Port[];
    position: {
        x: number;
        y: number;
    };
}
export interface Port {
    id: string;
    name: string;
    direction: 'input' | 'output' | 'bidirectional' | 'power';
    type: 'electrical' | 'passive';
}
export interface Label {
    id: string;
    text: string;
    position: {
        x: number;
        y: number;
    };
    rotation: number;
}
export interface SchematicAnnotation {
    id: string;
    type: 'note' | 'dimension' | 'callout' | 'warning';
    text: string;
    position: {
        x: number;
        y: number;
    };
}
export interface PCBLayoutData {
    id: string;
    name: string;
    boardSize: {
        width: number;
        height: number;
        unit: string;
    };
    layers: PCBLayer[];
    components: PCBComponent[];
    traces: Trace[];
    vias: Via[];
    planes: Plane[];
    designRules: DesignRules;
}
export interface PCBLayer {
    id: string;
    name: string;
    type: 'signal' | 'plane' | 'mechanical' | 'silkscreen' | 'soldermask' | 'paste';
    number: number;
    thickness?: number;
    material?: string;
}
export interface PCBComponent {
    id: string;
    designator: string;
    footprint: string;
    position: {
        x: number;
        y: number;
    };
    rotation: number;
    side: 'top' | 'bottom';
    locked: boolean;
}
export interface Trace {
    id: string;
    netName: string;
    layer: string;
    width: number;
    points: Array<{
        x: number;
        y: number;
    }>;
}
export interface Via {
    id: string;
    netName: string;
    position: {
        x: number;
        y: number;
    };
    diameter: number;
    holeSize: number;
    startLayer: string;
    endLayer: string;
}
export interface Plane {
    id: string;
    netName: string;
    layer: string;
    polygon: Array<{
        x: number;
        y: number;
    }>;
    clearance: number;
}
export interface DesignRules {
    minTraceWidth: number;
    minTraceSpacing: number;
    minViaSize: number;
    minHoleSize: number;
    minClearance: number;
    unit: string;
}
export interface ComponentData {
    id: string;
    designator: string;
    libraryReference: string;
    value: string;
    description: string;
    manufacturer?: string;
    partNumber?: string;
    datasheet?: string;
    footprint?: string;
    quantity: number;
    properties: ComponentProperties;
}
export interface ComponentProperties {
    tolerance?: string;
    voltage?: string;
    power?: string;
    temperature?: string;
    package?: string;
    mounting?: 'SMD' | 'THT';
    [key: string]: any;
}
export interface NetlistData {
    id: string;
    format: 'spice' | 'pads' | 'orcad' | 'allegro' | 'generic';
    nets: Net[];
    components: ComponentInstance[];
    generatedAt: Date;
    content?: string;
}
export interface EDARequirementPush {
    id: string;
    connectionId: string;
    projectId: string;
    requirements: Requirements;
    targetFiles: string[];
    pushType: 'parameters' | 'constraints' | 'specifications' | 'full';
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    result?: EDARequirementPushResult;
    createdAt: Date;
    completedAt?: Date;
}
export interface EDARequirementPushResult {
    success: boolean;
    filesUpdated: string[];
    parametersSet: Record<string, any>;
    errors: string[];
    warnings: string[];
    summary: string;
}
export interface EDASyncResult {
    connectionId: string;
    syncId: string;
    startTime: Date;
    endTime: Date;
    status: 'success' | 'partial' | 'failed';
    filesProcessed: number;
    filesSucceeded: number;
    filesFailed: number;
    conflicts: EDASyncConflict[];
    errors: EDASyncError[];
    summary: string;
}
export interface EDASyncConflict {
    fileId: string;
    fileName: string;
    conflictType: 'version' | 'content' | 'metadata';
    platformVersion: string;
    edaVersion: string;
    platformModified: Date;
    edaModified: Date;
    resolution?: 'platform' | 'eda' | 'merge' | 'manual';
    resolvedAt?: Date;
    resolvedBy?: string;
}
export interface EDASyncError {
    fileId: string;
    fileName: string;
    errorType: 'connection' | 'permission' | 'format' | 'validation' | 'unknown';
    errorMessage: string;
    errorCode?: string;
    timestamp: Date;
    retryable: boolean;
}
export interface SimulationSoftware {
    type: SimulationSoftwareType;
    name: string;
    version: string;
    vendor: string;
    capabilities: SimulationCapability[];
    supportedFileFormats: string[];
}
export type SimulationSoftwareType = 'ansys' | 'matlab' | 'simulink' | 'comsol' | 'abaqus' | 'ls-dyna' | 'openfoam' | 'star-ccm';
export type SimulationCapability = 'structural' | 'thermal' | 'fluid' | 'electromagnetic' | 'multiphysics' | 'optimization' | 'control-systems';
export interface SimulationJob {
    id: string;
    connectionId: string;
    projectId: string;
    name: string;
    type: SimulationCapability;
    status: SimulationJobStatus;
    parameters: SimulationParameters;
    inputFiles: SimulationFile[];
    results?: SimulationResults;
    progress: number;
    startTime: Date;
    endTime?: Date;
    estimatedDuration?: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export type SimulationJobStatus = 'queued' | 'preparing' | 'running' | 'post-processing' | 'completed' | 'failed' | 'cancelled';
export interface SimulationParameters {
    analysisType: string;
    solverSettings: Record<string, any>;
    meshSettings?: MeshSettings;
    boundaryConditions: BoundaryCondition[];
    materialProperties: MaterialProperty[];
    loadCases: LoadCase[];
    convergenceCriteria?: ConvergenceCriteria;
    outputRequests: OutputRequest[];
    customParameters: Record<string, any>;
}
export interface MeshSettings {
    type: 'structured' | 'unstructured' | 'hybrid';
    elementSize: number;
    refinementRegions: RefinementRegion[];
    qualityMetrics: Record<string, number>;
}
export interface RefinementRegion {
    name: string;
    geometry: string;
    elementSize: number;
    layers?: number;
}
export interface BoundaryCondition {
    id: string;
    name: string;
    type: string;
    location: string;
    values: Record<string, any>;
}
export interface MaterialProperty {
    id: string;
    name: string;
    type: string;
    properties: Record<string, any>;
    assignedTo: string[];
}
export interface LoadCase {
    id: string;
    name: string;
    type: string;
    magnitude: number;
    direction?: [number, number, number];
    location: string;
    timeHistory?: TimeHistoryData;
}
export interface TimeHistoryData {
    times: number[];
    values: number[];
}
export interface ConvergenceCriteria {
    maxIterations: number;
    tolerance: number;
    residualType: string;
}
export interface OutputRequest {
    id: string;
    name: string;
    type: string;
    variables: string[];
    frequency: number;
    locations?: string[];
}
export interface SimulationFile {
    id: string;
    name: string;
    path: string;
    type: 'input' | 'output' | 'geometry' | 'mesh' | 'results';
    format: string;
    size: number;
    checksum: string;
    uploadedAt: Date;
    metadata: Record<string, any>;
}
export interface SimulationResults {
    jobId: string;
    status: 'success' | 'partial' | 'failed';
    outputFiles: SimulationFile[];
    resultData: ResultData[];
    visualizations: ResultVisualization[];
    summary: ResultSummary;
    warnings: string[];
    errors: string[];
    computeTime: number;
    resourceUsage: ResourceUsage;
    generatedAt: Date;
}
export interface ResultData {
    id: string;
    name: string;
    type: string;
    dataType: 'scalar' | 'vector' | 'tensor' | 'timeseries';
    values: any[];
    units: string;
    location: string;
    timestamp?: Date;
    metadata: Record<string, any>;
}
export interface ResultVisualization {
    id: string;
    name: string;
    type: 'contour' | 'vector' | 'streamline' | 'animation' | 'chart' | 'table';
    imageUrl?: string;
    dataUrl?: string;
    interactive: boolean;
    thumbnail?: string;
    metadata: Record<string, any>;
}
export interface ResultSummary {
    maxValues: Record<string, number>;
    minValues: Record<string, number>;
    averageValues: Record<string, number>;
    criticalLocations: CriticalLocation[];
    convergenceHistory: ConvergenceHistory;
    performanceMetrics: Record<string, number>;
}
export interface CriticalLocation {
    name: string;
    type: string;
    location: string;
    value: number;
    units: string;
    severity: 'info' | 'warning' | 'critical';
}
export interface ConvergenceHistory {
    iterations: number[];
    residuals: number[];
    converged: boolean;
    finalResidual: number;
}
export interface ResourceUsage {
    cpuTime: number;
    memoryPeak: number;
    diskSpace: number;
    gpuUsage?: number;
    nodes?: number;
    cores?: number;
}
export interface SimulationConfiguration {
    connectionId: string;
    software: SimulationSoftware;
    credentials: SimulationCredentials;
    computeSettings: ComputeSettings;
    syncSettings: SimulationSyncSettings;
    apiEndpoint: string;
    webhookUrl?: string;
}
export interface SimulationCredentials {
    type: 'api-key' | 'oauth' | 'license-server' | 'ssh';
    apiKey?: string;
    accessToken?: string;
    refreshToken?: string;
    licenseServer?: string;
    sshHost?: string;
    sshPort?: number;
    sshUsername?: string;
    sshKey?: string;
}
export interface ComputeSettings {
    computeMode: 'local' | 'cloud' | 'hpc-cluster';
    maxConcurrentJobs: number;
    defaultPriority: 'low' | 'medium' | 'high';
    resourceLimits: ResourceLimits;
    queueSettings?: QueueSettings;
}
export interface ResourceLimits {
    maxCpuCores?: number;
    maxMemoryGB?: number;
    maxDiskGB?: number;
    maxGpus?: number;
    maxWallTime?: number;
}
export interface QueueSettings {
    queueName?: string;
    partition?: string;
    account?: string;
    qos?: string;
}
export interface SimulationSyncSettings {
    autoSync: boolean;
    syncInterval: number;
    syncResults: boolean;
    syncInputFiles: boolean;
    notifyOnCompletion: boolean;
    retryFailedJobs: boolean;
    maxRetries: number;
}
export interface SimulationWorkflow {
    id: string;
    name: string;
    projectId: string;
    connectionId: string;
    steps: WorkflowStep[];
    triggers: WorkflowTrigger[];
    status: 'active' | 'paused' | 'completed' | 'failed';
    createdAt: Date;
    updatedAt: Date;
}
export interface WorkflowStep {
    id: string;
    name: string;
    type: 'simulation' | 'data-processing' | 'optimization' | 'decision';
    order: number;
    parameters: Record<string, any>;
    dependencies: string[];
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    result?: any;
}
export interface WorkflowTrigger {
    id: string;
    type: 'manual' | 'schedule' | 'event' | 'condition';
    condition?: string;
    schedule?: string;
    event?: string;
    enabled: boolean;
}
export interface SimulationSyncResult {
    connectionId: string;
    syncId: string;
    startTime: Date;
    endTime: Date;
    status: 'success' | 'partial' | 'failed';
    jobsProcessed: number;
    jobsCompleted: number;
    jobsFailed: number;
    resultsImported: number;
    errors: SimulationSyncError[];
    summary: string;
}
export interface SimulationSyncError {
    jobId: string;
    jobName: string;
    errorType: 'connection' | 'permission' | 'format' | 'computation' | 'unknown';
    errorMessage: string;
    errorCode?: string;
    timestamp: Date;
    retryable: boolean;
}
export interface ProjectMetrics {
}
export interface TeamPerformanceMetrics {
}
export interface TimeTrackingData {
}
export interface ProgressTrendData {
}
export interface Risk {
    id: string;
    type: string;
    category: string;
    probability: number;
    impact: number;
    severity: string;
    title: string;
    description: string;
    affectedAreas: string[];
    rootCauses: string[];
    detectedAt: Date;
    estimatedOccurrence: Date;
    duration: number;
    mitigationStrategies: string[];
    currentStatus: string;
    owner: string;
    reviewDate: Date;
    escalationLevel: string;
}
export interface MitigationPlan {
}
export interface RiskPrediction {
}
export interface RiskTrend {
}
export interface RiskRecommendation {
}
export interface BestPractice {
    id: string;
    title: string;
    description: string;
    category: string;
    applicability: number;
    impact: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
    evidence: any[];
    implementation: any;
    caseStudies: any[];
    createdAt: Date;
}
export interface DataQualityMetrics {
    completeness: number;
    accuracy: number;
    timeliness: number;
}
export interface Requirements {
    functional: string[];
    nonFunctional: string[];
    constraints: string[];
    assumptions: string[];
}
export interface DesignSpecification {
    id: string;
    requirements: Requirements;
    specifications: any[];
    drawings: any[];
    calculations: any[];
    materials: any[];
    complianceValidation: any;
    generatedAt: Date;
    version?: string;
    generatedBy?: string;
    confidence?: number;
    reviewStatus?: string;
    optimizationObjectives?: any[];
    optimizationRationale?: string;
}
export interface MitigationPlan {
    id: string;
    riskId: string;
    primaryStrategy: string;
    alternativeStrategies: string[];
    requiredResources: string[];
    timeline: string;
    successMetrics: string[];
    contingencyPlan: string;
    estimatedCost: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
    assignedTo: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface RiskPrediction {
    id: string;
    riskType: string;
    description: string;
    probability: number;
    timeframe: string;
    triggers: string[];
    earlyWarnings: string[];
    confidence: number;
    modelVersion: string;
    predictedAt: Date;
}
export interface DeviceInfo {
}
export interface DeliverableTemplate {
}
export interface ToastMessage {
    message: string;
    type: 'success' | 'error';
}
export interface TaskAssignment {
    id: string;
    projectId: string;
    phaseId: string;
    sprintId: string;
    assignedTo: string;
    assignedBy: string;
    assignedRole: DynamicRole;
    status: 'assigned' | 'in-progress' | 'blocked' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'critical';
    estimatedHours: number;
    actualHours: number;
    instructions: TaskInstruction;
    dependencies: TaskDependency[];
    dueDate: Date;
    assignedAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    progressNotes?: ProgressNote[];
    assignee?: {
        name: string;
        email: string;
    };
    project?: {
        name: string;
    };
}
export interface TaskInstruction {
    id: string;
    taskId: string;
    title: string;
    content: string;
    methodology: string;
    acceptanceCriteria: string[];
    resources: string[];
    risks: string[];
    checkpoints: string[];
    estimatedTimeline: string;
    generatedAt: Date;
    generatedBy: 'ai' | 'manual' | 'fallback';
    confidence: number;
}
export interface TaskDependency {
    id: string;
    dependentTaskId: string;
    dependsOnTaskId: string;
    dependencyType: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';
    isBlocking: boolean;
    createdAt: Date;
}
export interface ProgressNote {
    id: string;
    taskId: string;
    userId: string;
    content: string;
    hoursWorked: number;
    createdAt: Date;
}
export interface NotificationTemplate {
    id: string;
    name: string;
    subject: string;
    content: string;
    variables: string[];
    type: 'email' | 'in-app' | 'push';
    createdAt: Date;
}
export interface EmailNotification {
    id: string;
    recipientEmail: string;
    subject: string;
    content: string;
    templateName: string;
    status: 'pending' | 'sent' | 'failed' | 'bounced';
    sentAt?: Date;
    errorMessage?: string;
    createdAt: Date;
}
//# sourceMappingURL=index.d.ts.map