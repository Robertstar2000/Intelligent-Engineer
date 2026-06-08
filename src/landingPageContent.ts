
export const FEATURES_CONTENT = `
# MIFECO VibraEngineer Features

Our platform is designed from the ground up to accelerate the engineering design process through intelligent automation and a structured, human-in-the-loop workflow.

---

### 1. AI-Powered Generation
Leverage the Google Gemini API to generate professional drafts of essential engineering documents. This includes everything from high-level requirements and feasibility studies to detailed Failure Modes and Effects Analysis (FMEA) and verification plans. This feature drastically reduces the time spent on tedious documentation.

### 2. Full Lifecycle Context Propagation
The output from each completed phase automatically informs the next. This creates a cohesive and intelligent workflow where the AI builds upon previously approved work, ensuring continuity and reducing redundant effort from start to finish.

### 3. Human-Mediated Agentic Process (HMAP)
Our core philosophy puts you in control. The AI acts as your agent, generating powerful drafts, but you provide the final verification, refinement, and approval. You can edit, regenerate, or chat with the AI to refine content, ensuring every document meets your exacting standards.

### 4. Domain-Specific Toolkits
The AI adapts its knowledge and terminology to fit your project's needs. By selecting up to three engineering disciplines (e.g., Mechanical, Electrical, Software), you tailor the AI's responses, making the generated content more relevant and accurate for your specific domain.

### 5. Structured, Best-Practice Workflows
The application isn't just a document generator; it's a project management framework. It enforces a proven engineering lifecycle, integrating best practices like:
- **Trade Studies**: Formally compare design concepts against weighted criteria.
- **DFMA & FMEA**: Automatically creates sprints for Design for Manufacturing and Assembly and Failure Modes analysis during the Critical Design phase.
- **Formal Design Reviews**: Generates a verification checklist for critical milestones, ensuring all success criteria are met before proceeding.

### 6. Comprehensive Export & Handoff
Easily package and share your work.
- **Download individual files** in Markdown format.
- **Export the entire project** as a structured \`.zip\` archive for offline storage or version control.
- **Generate "Vibe Prompts"**: Create highly detailed, context-rich prompts designed for AI coding assistants to accelerate software implementation and system simulation.
`;

export const LIFECYCLE_CONTENT = `
# The MIFECO VibraEngineer Lifecycle

Our platform guides your project through a structured, multi-phase lifecycle based on proven systems engineering models like the V-Model. Each phase has a specific purpose and builds upon the last.

---

### Phase 1: Feasibility Study
Before committing resources, the AI performs a comprehensive Feasibility Study using the TELOS framework:
- **T**echnical: Can we build it?
- **E**conomic: Is it cost-effective?
- **L**egal: Does it comply with regulations?
- **O**perational: Will it fit into existing workflows?
- **S**cheduling: Can it be done on time?
The output is a clear "Go/No-Go" recommendation.

### Phase 2: Requirements
This multi-document phase defines the project's foundation. The AI helps you generate a detailed **Project Scope** that outlines what the system will and will not do. This ensures all stakeholders are aligned.

### Phase 3: Preliminary Design
This is the conceptual stage. The AI generates multiple **Conceptual Design Options**. You then generate a **Trade Study Analysis** where the AI formally compares these concepts, helping you make a data-driven decision on the best path forward. This phase concludes with a mandatory **Design Review**.

### Phase 4: Critical Design
This is where the chosen concept is detailed.
1. The AI first generates a **Preliminary Design Specification** and a set of required **Development Sprints**.
2. These sprints mandatorily include **DFMA (Design for Manufacturing & Assembly)** and **FMEA (Failure Modes & Effects Analysis)**.
3. You then generate a detailed technical specification for each sprint.
4. As each sprint is completed, its content is merged into the main design document. This phase also requires a formal **Design Review**.

### Phase 5: Testing
This phase focuses on ensuring quality through two key documents:
- **Verification Plan**: Confirms you built the product *correctly* according to the design specifications.
- **Validation Plan**: Confirms you built the *right* product that meets the user's needs.

### Phase 6: Launch
The AI helps formulate a strategic **Launch Plan**, considering factors like phased rollouts, user training, and marketing coordination.

### Phase 7: Operation
This phase focuses on the live product. The AI generates an **Operations & Maintenance Plan** that outlines monitoring protocols, preventative maintenance schedules, and incident response procedures.

### Phase 8: Improvement
The final phase looks to the future. The AI generates an **Improvement & Enhancement Plan** by analyzing potential user feedback, performance data, and the competitive landscape to create a feature roadmap for future versions.
`;

export const ABOUT_CONTENT = `
# About MIFECO VibraEngineer

## Our Mission

At MIFECO VibraEngineer, our mission is to **supercharge the engineering design process** by creating an intelligent, collaborative partnership between human experts and artificial intelligence. We believe that AI should not replace engineers, but rather serve as a powerful tool to augment their creativity, handle tedious tasks, and accelerate the journey from concept to reality.

---

## The HMAP Philosophy

Our platform is built on a core principle we call the **Human-Mediated Agentic Process (HMAP)**. This philosophy ensures that while our AI agents can autonomously generate complex documentation and perform sophisticated analyses, the human engineer is always in the driver's seat.

-   **You are the expert**: The AI provides drafts, suggestions, and analysis, but your expertise, intuition, and final approval are what guide the project to success.
-   **Collaboration, not replacement**: We are building a co-pilot, not an auto-pilot. The best results come from a tight feedback loop where you refine, edit, and guide the AI's output.
-   **Accelerating, not automating**: Our goal is to take a design process that typically takes months and condense it into days or weeks, freeing up valuable engineering time to focus on innovation, problem-solving, and building great products.

## The Technology

The MIFECO VibraEngineer Partner is a demonstration of what's possible with cutting-edge AI. It leverages the powerful reasoning and generation capabilities of the **Google Gemini API** within a structured, user-friendly React application. By combining a sophisticated prompt-engineering framework with a deep understanding of proven engineering methodologies, we've created a tool that is both powerful and practical.

We are committed to pushing the boundaries of what's possible in AI-assisted engineering and are excited to be on this journey with you.
`;