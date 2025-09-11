
# Intelligent Engineering Partner - Specification Document

## 1. Application Overview

The **Intelligent Engineering Partner** is a web-based application designed to assist engineers through the entire project lifecycle. It acts as an AI-powered companion, leveraging the Google Gemini API to generate professional, context-aware engineering documentation. The application follows a structured, phase-based workflow, ensuring that each step of the engineering process builds upon the last, from initial requirements to final launch.

The core methodology is a Human-Mediated Agentic Process (HMAP), where the user guides the AI, tunes its output, and retains final control over all generated content, ensuring quality and accuracy.

## 2. Core Functionality

-   **Project Lifecycle Management**: Users can create, manage, and track engineering projects from start to finish.
-   **Multi-Step Project Wizard**: A guided setup process to define a new project's name, requirements, constraints, and relevant engineering disciplines.
-   **Phase-Based Workflow**: Projects are pre-structured into logical engineering phases (e.g., Requirements, Preliminary Design, Critical Design), providing a clear roadmap.
-   **AI-Powered Content Generation**: The central feature where the application calls the Google Gemini API (`gemini-2.5-flash` model) to generate detailed documentation for each phase.
-   **Contextual Continuity**: The AI maintains context from the most recently completed phase, ensuring that generated content for a new phase is relevant and builds upon previous work. This prevents the request payload from becoming too large on complex projects.
-   **Tunable AI Output**: Users can adjust several parameters (e.g., detail level, creativity, cost optimization) for each phase to fine-tune the focus and style of the AI's response.
-   **Interactive Output**: Generated content is rendered as formatted Markdown, with syntax highlighting for code blocks. Users can manually edit, save, or regenerate the content at any time.
-   **Centralized Document Management**: A dedicated "Documents" page lists all generated phase outputs for easy access and management.
-   **Flexible Document Export**: Users can download individual phase documents as Markdown (`.md`) files or download all project documents at once as a single `.zip` archive. The zip file includes a `00_Project_Summary.md` file containing the project's name, disciplines, requirements, and constraints, followed by all numbered phase documents.

## 3. Application Flow and Logic

The application is a single-page application (SPA) built with React that manages the user's journey through different views.

1.  **Landing Page (`LandingPage`)**: The initial entry point. It describes the app's features and prompts the user to start a new project.
2.  **Project Wizard (`ProjectWizard`)**:
    -   Triggered by clicking "Start New Project".
    -   A four-step modal form collects:
        1.  Project Name
        2.  Requirements
        3.  Constraints
        4.  Up to three Engineering Disciplines (filterable search).
    -   Upon completion, a `Project` object is created in the application's state. This object includes a predefined list of `Phase` objects, each with its own default `tuningSettings`.
3.  **Dashboard (`Dashboard`)**:
    -   The main view after a project is created.
    -   Displays the project's name, disciplines, requirements, and constraints in summary cards.
    -   Shows overall project progress with a progress bar.
    -   Lists all project phases, showing their status (`not-started`, `in-progress`, `completed`).
    -   The user can click on any phase to navigate to the detailed `PhaseView`.
    -   Contains a "View Documents" button to navigate to the `DocumentsPage`.
4.  **Phase View (`PhaseView`)**:
    -   This is the primary interaction view for the AI.
    -   It displays the selected phase's details, tuning controls, and output section.
    -   **Generation Logic**:
        -   When the user clicks "Generate Output", the `generateOutput` function is called.
        -   It first checks if the `API_KEY` is present.
        -   A **system instruction** is defined to prime the AI, telling it to act as an expert engineering assistant and to format its response in Markdown.
        -   A detailed **user prompt** is constructed, containing:
            -   Project metadata (name, disciplines, requirements, constraints).
            -   **Context**: The full output from the *most recent* previously completed phase.
            -   The current phase's name and description.
            -   The current `tuningSettings` for the phase.
            -   A final instruction to generate the document.
        -   The `GoogleGenAI` client is initialized, and `ai.models.generateContent` is called with the model, prompt, and system instruction.
        -   On a successful response, the application state is updated with the generated text, and the phase status is moved to `in-progress`.
        -   Errors are caught and displayed to the user.
    -   **Output Handling (`PhaseOutput`)**:
        -   The generated Markdown string is rendered into styled HTML using the `Remarkable` library.
        -   Code blocks are automatically syntax-highlighted using `Prism.js`.
        -   The user can switch to an "edit mode" to modify the content in a `<textarea>`, save changes, or cancel.
5.  **Documents Page (`DocumentsPage`)**:
    -   Accessible via a "View Documents" button on the Dashboard.
    -   Lists all phases that have generated output.
    -   Provides a "Download .md" button for each document.
    -   Features a "Download All as .zip" button, which uses the `JSZip` library to create a zip archive of all documents on the client-side.
    -   Includes an empty state message if no documents have been generated yet.

## 4. Key Components & Architecture

-   **`EngineeringPartnerApp` (index.tsx)**: The root component that manages top-level state, including `currentView`, `currentProject`, and `selectedPhase`. It handles navigation and passes state and update functions down to its children.
-   **`PhaseView.tsx`**: A container component for a single phase. It orchestrates the API call, manages loading and error states, and integrates all sub-components related to the phase.
-   **`PhaseOutput.tsx`**: A presentational component responsible for displaying the AI-generated Markdown, managing the edit/view state, and rendering the generate/regenerate buttons.
-   **`TuningControls.tsx`**: A component that dynamically renders slider controls based on the `tuningSettings` object for the current phase.
-   **UI Components (`ui.tsx`)**: A set of reusable, stateless components (`Button`, `Card`, `Badge`, `ProgressBar`) that provide a consistent look and feel throughout the application.

## 5. Technology Stack

-   **Frontend Framework**: React
-   **AI Integration**: `@google/genai` SDK for the Google Gemini API.
-   **AI Model**: `gemini-2.5-flash`
-   **Styling**: Tailwind CSS
-   **Markdown Rendering**: `remarkable`
-   **Syntax Highlighting**: `Prism.js`
-   **File Archiving**: `JSZip`
-   **Icons**: `lucide-react`
