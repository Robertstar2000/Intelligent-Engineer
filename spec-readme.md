# Vibe Engineering Partner - Specification Document

## 1. Application Overview

The **Vibe Engineering Partner** is a sophisticated web application that serves as an AI-powered companion for engineers, guiding them through the complete project lifecycle. Built with React and leveraging the Google Gemini API (`gemini-2.5-flash` model), the application provides a structured, phase-based workflow incorporating industry-best practices like **Trade Studies**, **Design for Manufacturing and Assembly (DFMA)**, **Failure Modes and Effects Analysis (FMEA)**, and formal **Verification and Validation (V&V)** planning.

The core methodology is a **Human-Mediated Agentic Process (HMAP)**. The user initiates and guides the AI, tunes its generation parameters, and retains full editorial control over all generated content. This ensures a collaborative process where the AI provides powerful drafts and analyses, while the human expert provides the final verification, refinement, and approval.

## 2. Data Models

The application revolves around a central `Project` object with nested `Phase` and `Sprint` objects.

-   **`Project`**: The top-level container for a single engineering endeavor.
    ```typescript
    interface Project {
      id: string;
      name: string;
      requirements: string; // Core objectives and functionalities
      constraints: string; // Limitations like budget, timeline, tech
      disciplines: string[]; // e.g., 'Mechanical Engineering'
      currentPhase: number; // Index of the active phase
      phases: Phase[];
    }
    ```
-   **`Phase`**: A distinct stage in the engineering lifecycle.
    ```typescript
    interface Phase {
      id: string;
      name: string; // e.g., 'Preliminary Design'
      description: string;
      status: 'not-started' | 'in-progress' | 'in-review' | 'completed';
      sprints: Sprint[]; // Used for sub-documents or development sprints
      tuningSettings: { [key: string]: number }; // Parameters for the AI
      output?: string; // The final, merged Markdown content
      designReview?: { required: boolean; checklist: ... };
    }
    ```
-   **`Sprint`**: A sub-component of a phase, representing either a required sub-document or a development work package.
    ```typescript
    interface Sprint {
      id: string;
      name: string;
      description: string;
      status: 'not-started' | 'in-progress' | 'completed';
      deliverables: string[]; // AI-generated list of tangible outcomes
      output?: string; // The Markdown content for this specific sprint
    }
    ```

## 3. Core Functionality

-   **Guided Project Setup**: A multi-step wizard captures the project's name, core requirements, constraints, and up to three relevant engineering disciplines to tailor the AI's domain knowledge.
-   **Structured Lifecycle Workflow**: Projects are pre-configured with a sequence of standard engineering phases. A locking mechanism ensures that phases are tackled in order, preventing users from starting a phase before its prerequisite is complete.
-   **Advanced AI Content Generation**:
    -   **Context Propagation**: The AI prompt for each new phase automatically includes the final, approved output from the *most recently completed phase*, ensuring seamless continuity.
    -   **Detailed Prompt Engineering**: User inputs (requirements, constraints), contextual data (previous phase output), and phase-specific tuning parameters are programmatically combined into a comprehensive prompt to guide the `gemini-2.5-flash` model.
    -   **Tunable Controls**: Users can adjust sliders for parameters like `technicalDepth`, `creativity`, or `riskTolerance` to influence the tone, focus, and detail of the generated documentation.
-   **Specialized Phase Workflows**: The application adapts its UI and logic for different types of engineering work:
    -   **Multi-Document Phases**: `Requirements`, `Preliminary Design`, and `Testing` are broken down into a series of mandatory sub-documents that must be generated sequentially before the phase can be completed.
    -   **Sprint-Based Phase**: The `Critical Design` phase first generates a high-level specification and a list of development sprints (mandating **DFMA** and **FMEA**). Users then generate detailed technical specifications for each sprint individually.
    -   **Standard Phases**: `Launch`, `Operation`, and `Improvement` follow a simpler, single-document generation process.
-   **AI-Assisted Design Reviews**: For critical design gates (`Preliminary Design`, `Critical Design`), the AI automatically generates a formal review checklist based on the final phase document. This ensures all key success criteria are verified before proceeding.
-   **Interactive Document Management**:
    -   All generated content is rendered as rich Markdown with syntax highlighting.
    -   Users have full editorial control to modify, save, or regenerate content.
    -   A centralized "Documents" page provides access to all generated artifacts.
    -   Outputs can be downloaded as individual `.md` files or as a single, well-structured `.zip` archive containing all project documentation and a summary file.

## 4. Application Flow & Phase Logic

The application operates as a single-page application, managing views based on user actions. The core logic resides within the `PhaseView` component, which dynamically adapts to the current phase's requirements.

1.  **Landing Page & Wizard**: The user starts on a landing page and proceeds through the 4-step wizard to create the initial `Project` object.
2.  **Dashboard**: This view provides a project overview and entry points into the individual phases. It enforces the sequential workflow by disabling future, un-started phases.
3.  **Phase View (`PhaseView`)**: This is the main interactive screen where all AI generation occurs. Its behavior is highly conditional:

    -   **Multi-Document Phase Logic (e.g., `Preliminary Design`)**:
        1.  The view displays a list of required sub-documents (e.g., "1. Conceptual Design Options", "2. Trade Study Analysis").
        2.  The user clicks "Generate" for the first document. A highly specific prompt is sent to the AI (e.g., *"Generate at least three distinct, high-level conceptual design options..."*).
        3.  After the first document is generated, the user generates the second. The prompt for the second document includes the output of the first as context (e.g., the Trade Study prompt is given the Conceptual Designs).
        4.  Once all sub-documents are generated and marked complete, the "Mark Phase Complete" button is enabled. Clicking it merges all sub-document outputs into the main `phase.output` field.

    -   **Critical Design Phase Logic**:
        1.  **Initial Generation**: The user first clicks a "Generate Spec & Sprints" button. The AI is instructed to return a JSON object containing a `preliminarySpec` (Markdown string) and a `sprints` array (list of sprint names/descriptions), which must include **DFMA** and **FMEA**.
        2.  **Sprint Generation**: The view then displays the preliminary spec and a list of the generated sprints. The user generates a technical specification for each sprint individually.
        3.  The prompt for the FMEA sprint is specialized, instructing the AI to act as a reliability engineer and produce a formal FMEA table.
        4.  **Merge Sprints**: As each sprint's output is accepted, it is appended to the main `phase.output` document, and its status is set to `completed`.
        5.  The phase can only be completed once all sprints are merged.

    -   **Design Review Logic**:
        1.  When a user completes a phase where `designReview.required` is `true` (Preliminary & Critical Design), the phase `status` changes to `in-review`.
        2.  The `PhaseView` calls `generateDesignReviewChecklist`, sending the final document to the AI with a prompt to create a checklist of 5-7 critical verification items.
        3.  The view then displays the final document and the interactive checklist.
        4.  The user must check every box. Only then can they click "Finalize Review," which sets the phase `status` to `completed` and unlocks the next phase.

## 5. Key Components & Architecture

-   **`EngineeringPartnerApp` (index.tsx)**: The root component managing global state, including the `currentProject` object and the current `currentView`.
-   **`PhaseView.tsx`**: The most critical component. It houses the state and logic for AI generation, handles all API calls to the Gemini API, and contains the conditional rendering logic for the different phase types (multi-document, sprint-based, standard, and in-review).
-   **`PhaseOutput.tsx`**: A reusable component responsible for displaying and enabling the editing of generated Markdown content for standard phases.
-   **`TuningControls.tsx`**: Renders the slider controls for adjusting AI generation parameters.
-   **UI Components (`ui.tsx`)**: A library of stateless, reusable components like `Button`, `Card`, `Badge`, and `ProgressBar` to ensure a consistent look and feel.

## 6. Technology Stack

-   **Frontend Framework**: React
-   **AI Integration**: `@google/genai` SDK
-   **AI Model**: `gemini-2.5-flash`
-   **Styling**: Tailwind CSS
-   **Markdown Rendering**: `remarkable`
-   **Code Syntax Highlighting**: `Prism.js`
-   **File Archiving**: `JSZip`
-   **Icons**: `lucide-react`