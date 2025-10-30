

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

## 3. Methodology & Workflows

### Understanding HMAP (Human-Mediated Agentic Process)

The Intelligent Engineering Partner is built on a core philosophy called HMAP, which stands for **Human-Mediated Agentic Process**. This isn't just about having an AI write documents for you; it's a collaborative partnership where you are always in control.

#### How it Works:

1.  **You Initiate**: Every task, from generating a requirements document to creating a test plan, is initiated by you. You provide the high-level goals and context.
2.  **You Tune**: Before generation, you can use the **Tuning Controls** to guide the AI's "thought process." Need a highly creative and conceptual design? Increase the \`creativity\` slider. Need a rigorous, safety-critical FMEA? Increase \`technicalDepth\` and \`failureAnalysis\`. This allows you to tailor the AI's output to the specific needs of the task at hand.
3.  **AI Generates**: The AI acts as your agent, taking your direction and the project's context to produce a detailed, professional first draft. It does the heavy lifting of research, structuring, and writing.
4.  **You Verify and Refine**: **This is the most critical step.** The AI's output is never final. You, the human expert, review the generated content. You can use the built-in editor to make changes, correct inaccuracies, add proprietary knowledge, and ensure the document meets your standards. You can also ask the AI to regenerate the content with different tuning parameters.
5.  **You Approve**: Only when you are satisfied with the document do you mark the task or phase as complete. This final approval is a human decision, ensuring that every piece of the project has been validated by an expert.

This process ensures you get the speed and power of AI without sacrificing the quality, accuracy, and expert oversight required for professional engineering projects. The AI is a powerful tool, but you are always the engineer in charge.

### Best-in-Class Engineering Workflows

This tool has several professional engineering processes built directly into the workflow.

-   **Trade Studies (Preliminary Design)**: This phase requires you to first generate multiple **Conceptual Design Options**. You then generate a **Trade Study Analysis** where the AI formally compares the concepts against weighted criteria to help you make a data-driven decision.
-   **DFMA & FMEA (Critical Design)**: When you initiate the "Critical Design" phase, the AI is required to create two specific sprints: a **Design for Manufacturing and Assembly (DFMA)** sprint to optimize for production, and a **Failure Modes and Effects Analysis (FMEA)** sprint to systematically identify and mitigate potential failures. The mandatory **Design Review** for this phase will then verify the comprehensiveness of these analyses.
-   **Verification & Validation (Testing)**: The "Testing" phase is split into two required documents:
    *   **Verification Plan**: Confirms you built the product correctly according to the design specifications.
    *   **Validation Plan**: Confirms you built the right product that meets the user's needs.

## 4. Tips for Success

-   **Garbage In, Garbage Out**: The quality of the AI's output is highly dependent on the quality of your input. Write clear, detailed, and unambiguous requirements and constraints.
-   **Iterate**: Don't expect the first generated output to be perfect. Use the "Regenerate" button and adjust tuning controls. Think of it as a brainstorming session with your AI partner.
-   **Use the Edit Function**: The AI provides a strong first draft. Use the edit feature to refine the details, add specific proprietary information, and ensure it meets your organization's standards.
-   **Context is Key**: Remember that each new phase generation uses the *most recently completed* phase as context. Ensure a phase is truly complete and accurate before marking it as such.

## 5. API Key Configuration

This application is powered by the Google Gemini API. It is designed to be pre-configured with a secure API key provided by the application administrator. You do not need to enter an API key yourself.

If AI features appear disabled or return errors, it indicates a problem with the API key configuration in the application's environment. In this case, please contact your administrator for assistance.

## 6. Project Exports & Handoff

Once you have generated documentation for your project, the **Documents** page provides powerful tools to package and hand off your work. These exports are designed to integrate with other tools and workflows, from project management software to AI-powered coding assistants.

### A) Project Archive (.zip)

-   **What it is**: A complete archive of all generated documentation in a single \`.zip\` file.
-   **Structure**: The archive is neatly organized into folders, one for each phase of your project. It also includes a top-level \`00_Project_Summary.md\` file containing your initial requirements, constraints, and disciplines.
-   **Value**: This is the perfect way to create a permanent, offline record of your project. It's ideal for version control, sharing with stakeholders, or meeting compliance requirements.

### B) Vibe Prompts (AI Code Generation)

The term "vibe prompt" refers to a highly detailed, context-rich prompt that is designed to be given to another AI model, specifically one that generates code (like a "vibe code IDE"). These prompts act as a bridge between your detailed engineering design and the actual implementation.

-   **Generate Vibe Coding Prompt**:
    -   **What it is**: This generates a comprehensive "technical brief" prompt that instructs an AI coding assistant to write the full, production-ready source code for your project.
    -   **How it works**: It intelligently synthesizes all your project's documentation into a single, expert-level set of instructions. This isn't just a summary; it's a complete technical specification that directs the coding AI to define the architecture, detail all core logic and data models, specify APIs, and outline testing and deployment strategies.
    -   **Value**: This dramatically accelerates development. Instead of a developer interpreting pages of documentation, they can feed this single, self-contained prompt to a coding AI to get a robust, feature-complete, and well-architected starting point for the codebase.

-   **Generate Simulation Prompt**:
    -   **What it is**: This generates a prompt focused on creating a functional *simulation* of your designed system, rather than production code.
    -   **How it works**: It instructs a coding AI to model the system's behavior, logic, and interactions. It directs the AI to identify key variables, define the simulation model, design a simple UI for control and visualization, and specify data logging for performance analysis (KPIs).
    -   **Value**: Simulations are invaluable for de-risking complex projects. They allow you to validate your design choices, identify potential bottlenecks, and demonstrate the system's functionality to stakeholders long before you build physical hardware or write production software. This prompt ensures the simulation is technically sound and useful for analysis.
`;