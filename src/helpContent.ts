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
-   The **Project Lifecycle** section lists all phases. Click on any phase to start working on it.
-   Use the **"View Documents"** button to see all generated files.

### Step 3: Generate Phase Documentation

1.  Select a phase from the dashboard to go to the **Phase View**.
2.  **Adjust Tuning Controls**: Before generating, review the sliders. These parameters guide the AI. For example, for a "Preliminary Design" phase, you might increase "Creativity". For "Critical Design", you might increase "Technical Depth".
3.  **Generate Output**: Click the **"Generate Output with AI"** button. The application will send your project details and tuning settings to the AI.
4.  **Review and Edit**: The generated document will appear in the **Phase Output** card.
    *   You can read the rendered Markdown.
    *   Click **"Edit"** to make manual changes in a text editor. Save your changes when done.
    *   Click **"Regenerate"** if you're not satisfied with the output. You can adjust the tuning controls before regenerating for a different result.
5.  **Mark Complete**: Once you are satisfied with the output for a phase, click **"Mark Phase Complete"**. This locks in the content, which will then be used as context for the *next* phase you generate.

### Step 4: Manage and Download Documents

-   Navigate to the **Documents** page from the dashboard.
-   Here you can see a list of all phases for which you've generated content.
-   Click **"Download .md"** to get a single file.
-   Click **"Download All as .zip"** to get a complete archive of your project documentation.

## 3. Understanding HMAP

**HMAP** stands for **Human-Mediated Agentic Process**. It's the core philosophy behind this tool, designed to advance human-AI collaboration. Instead of the AI working autonomously, you are always in control.

### How HMAP Works in this App

1.  **Define Research Domain**: You collaborate with the AI to establish the scope, boundaries, and objectives for your project by providing detailed requirements and constraints.
2.  **Systematic Collaboration**: You work through structured workflows (the project phases) with AI assistance, while maintaining human oversight at key decision points (reviewing, editing, and approving generated content).
3.  **Quality Assurance**: Comprehensive validation and documentation, managed by you, ensure the integrity and reproducibility of the project deliverables.

HMAP ensures that the AI acts as a powerful assistant, augmenting your expertise rather than replacing it.

## 4. Tips for Real Engineering Projects

-   **Garbage In, Garbage Out**: The quality of the AI's output is highly dependent on the quality of your input. Write clear, detailed, and unambiguous requirements and constraints.
-   **Iterate**: Don't expect the first generated output to be perfect. Use the "Regenerate" button and adjust tuning controls. Think of it as a brainstorming session with your AI partner.
-   **Use the Edit Function**: The AI provides a strong first draft. Use the edit feature to refine the details, add specific proprietary information, and ensure it meets your organization's standards.
-   **Context is Key**: Remember that each new phase generation uses the *most recently completed* phase as context. Ensure a phase is truly complete and accurate before marking it as such.
-   **Critical Design Sprints**: The "Critical Design" phase is special. It first generates a preliminary specification and a list of implementation sprints. You must then generate the technical details for each sprint and "merge" them into the main document to complete the phase. This models a real-world agile development process.
`;