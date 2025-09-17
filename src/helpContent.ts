export const HELP_CONTENT = `
# Intelligent Engineering Partner - Help Guide

Welcome! This guide provides everything you need to know to effectively use the Intelligent Engineering Partner for your projects.

## 1. Core Features

-   **AI-Powered Generation**: Leverage the Google Gemini API to generate professional, context-aware engineering documentation for every phase of your project.
-   **Full Project Lifecycle**: A structured workflow guides you from initial requirements and research through design, testing, launch, and improvement.
-   **Context Propagation**: The AI remembers what was generated in the previous phase, ensuring continuity and building upon prior work.
-   **Domain Toolkits**: The AI's output is tailored to the specific engineering disciplines you select for your project.
-   **Tunable Controls**: Fine-tune the AI's output for each phase by adjusting parameters like creativity, technical depth, and risk tolerance.
-   **Interactive Documentation**: All generated content is rendered in Markdown. You can edit, save, regenerate, and download documents at any time.
-   **Comprehensive Export**: Download individual phase documents as \`.md\` files or get a \`.zip\` archive of the entire project, complete with a project summary.

## 2. Operating Instructions

### Step 1: Create a New Project

1.  From the **Landing Page**, click **"Start New Project"**.
2.  The **Project Wizard** will appear. Follow the four steps:
    *   **Project Name**: Give your project a clear, descriptive name.
    *   **Requirements**: Define the core goals, functionalities, and performance criteria. Be as specific as possible.
    *   **Constraints**: List all limitations, such as budget, timeline, regulations, available technology, or manufacturing capabilities.
    *   **Disciplines**: Select up to three engineering disciplines relevant to your project. This helps the AI tailor its response.
3.  Click **"Create Project"**.

### Step 2: Navigate the Dashboard

-   The **Dashboard** gives you a high-level overview of your project.
-   You can review your requirements, constraints, and disciplines.
-   The **Project Lifecycle** section lists all phases. Click on a phase to begin work. Note that phases are locked until the previous one is completed.

### Step 3: Generate Phase Documentation

The process varies slightly depending on the phase's complexity.

#### A) Multi-Document Phases (Requirements, Preliminary Design, Testing)
These phases require you to generate a series of distinct documents to complete them.
1. Select the phase from the dashboard.
2. In the **"Required Documents"** card, you will see a list of documents (e.g., "Project Scope", "Trade Study Analysis", "Verification Plan").
3. Click **"Generate Document"** for each one. Note that some documents use previous ones in the same phase as context (e.g., the Trade Study uses the Conceptual Designs).
4. Once all documents are generated, the **"Mark Phase Complete"** button (or "Commit for Design Review") will become active. Clicking it will merge all the documents into a single output file for that phase.

#### B) Standard Phases (Launch, Operation, etc.)
1.  Select a phase from the dashboard.
2.  **Adjust Tuning Controls**: Review the sliders to guide the AI.
3.  **Generate Output**: Click the **"Generate Output with AI"** button.
4.  **Review and Edit**: The generated document will appear in the **Phase Output** card. You can edit, save, or regenerate as needed.
5.  **Mark Complete**: Once you are satisfied, click **"Mark Phase Complete"**.

### Step 4: Manage and Download Documents

-   Navigate to the **Documents** page from the dashboard.
-   Here you can see a list of all phases for which you've generated content.
-   Click **"Download .md"** to get a single file.
-   Click **"Download All as .zip"** to get a complete archive of your project documentation.

## 3. Best-in-Class Engineering Workflows

This tool has several professional engineering processes built directly into the workflow.

-   **Trade Studies (Preliminary Design)**: This phase requires you to first generate multiple **Conceptual Design Options**. You then generate a **Trade Study Analysis** where the AI formally compares the concepts against weighted criteria to help you make a data-driven decision.
-   **DFMA & FMEA (Critical Design)**: When you initiate the "Critical Design" phase, the AI is required to create a **Design for Manufacturing and Assembly (DFMA)** sprint, ensuring you consider production early. The mandatory **Design Review** for this phase will have the AI act as a Principal Engineer, checking for both DFMA principles and a **Failure Modes and Effects Analysis (FMEA)**.
-   **Verification & Validation (Testing)**: The "Testing" phase is split into two required documents:
    *   **Verification Plan**: Confirms you built the product correctly according to the design specifications.
    *   **Validation Plan**: Confirms you built the right product that meets the user's needs.

## 4. Tips for Success

-   **Garbage In, Garbage Out**: The quality of the AI's output is highly dependent on the quality of your input. Write clear, detailed, and unambiguous requirements and constraints.
-   **Iterate**: Don't expect the first generated output to be perfect. Use the "Regenerate" button and adjust tuning controls. Think of it as a brainstorming session with your AI partner.
-   **Use the Edit Function**: The AI provides a strong first draft. Use the edit feature to refine the details, add specific proprietary information, and ensure it meets your organization's standards.
-   **Context is Key**: Remember that each new phase generation uses the *most recently completed* phase as context. Ensure a phase is truly complete and accurate before marking it as such.
`;