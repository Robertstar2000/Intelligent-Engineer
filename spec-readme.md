
# Intelligent Engineering Partner - Specification Document

## 1. Application Overview

The **Intelligent Engineering Partner** is a web-based application designed to assist engineers through the entire project lifecycle. It acts as an AI-powered companion, leveraging the Google Gemini API to generate professional, context-aware engineering documentation. The application follows a structured, phase-based workflow that incorporates best-in-class engineering processes like **Trade Studies**, **Design for Manufacturing and Assembly (DFMA)**, **Failure Modes and Effects Analysis (FMEA)**, and formal **Verification and Validation (V&V)** planning.

The core methodology is a Human-Mediated Agentic Process (HMAP), where the user guides the AI, tunes its output, and retains final control over all generated content, ensuring quality and accuracy.

## 2. Core Functionality

-   **Project Lifecycle Management**: Users can create, manage, and track engineering projects from start to finish.
-   **Multi-Step Project Wizard**: A guided setup process to define a new project's name, requirements, constraints, and relevant engineering disciplines.
-   **Phase-Based Workflow**: Projects are pre-structured into logical engineering phases (e.g., Requirements, Preliminary Design, Critical Design), providing a clear roadmap.
-   **AI-Powered Content Generation**: The central feature where the application calls the Google Gemini API (`gemini-2.5-flash` model) to generate detailed documentation for each phase.
-   **Contextual Continuity**: The AI maintains context from the most recently completed phase, ensuring that generated content for a new phase is relevant and builds upon previous work.
-   **Tunable AI Output**: Users can adjust several parameters (e.g., detail level, creativity, cost optimization) for each phase to fine-tune the focus and style of the AI's response.
-   **Interactive Output**: Generated content is rendered as formatted Markdown. Users can manually edit, save, or regenerate the content at any time.
-   **Centralized Document Management**: A dedicated "Documents" page lists all generated phase outputs for easy access and management.
-   **Flexible Document Export**: Users can download individual phase documents as Markdown (`.md`) files or download all project documents at once as a single `.zip` archive.

## 3. Application Flow and Logic

The application is a single-page application (SPA) built with React that manages the user's journey through different views.

1.  **Landing Page**: The initial entry point.
2.  **Project Wizard**: Collects project name, requirements, constraints, and disciplines. Upon completion, a `Project` object is created with a predefined phase structure.
3.  **Dashboard**: The main project overview, showing progress and listing all lifecycle phases.
4.  **Phase View (`PhaseView`)**: This is the primary interaction view for the AI. The behavior of this view changes depending on the phase:
    -   **Multi-Document Phases (Requirements, Preliminary Design, Testing)**: These phases are broken down into required sub-documents (e.g., "Project Scope" and "SOW" for Requirements; "Conceptual Design Options" and "Trade Study Analysis" for Preliminary Design; "Verification Plan" and "Validation Plan" for Testing). The user must generate each document individually. The phase is completed by merging all sub-documents into a single output file.
    -   **Sprint-Based Phase (Critical Design)**: This phase has a two-step generation process.
        1.  First, the user generates a high-level "Preliminary Design Specification" and a list of AI-defined implementation sprints. The AI is required to include a "Design for Manufacturing and Assembly (DFMA)" sprint.
        2.  The user then generates the technical details for each sprint individually.
        3.  Completed sprints are merged into the main specification document.
    -   **Standard Phases (Launch, Operation, Improvement)**: These phases generate a single, comprehensive document.
    -   **Design Reviews**: For the "Preliminary Design" and "Critical Design" phases, completing the phase triggers a mandatory Design Review. The AI generates a checklist of success factors (e.g., checking for **FMEA** and **DFMA** in Critical Design) that the user must verify before the phase is officially marked as complete.
5.  **Documents Page (`DocumentsPage`)**:
    -   Lists all phases that have generated output.
    -   Provides download buttons for individual `.md` files or a complete project `.zip` archive.

## 4. Key Components & Architecture

-   **`EngineeringPartnerApp` (index.tsx)**: The root component that manages top-level state.
-   **`PhaseView.tsx`**: A container component for a single phase. It contains conditional logic to render the appropriate UI for standard, multi-document, or sprint-based phases. It orchestrates all API calls.
-   **`PhaseOutput.tsx`**: A presentational component for displaying AI-generated Markdown for standard phases.
-   **`TuningControls.tsx`**: A component that renders slider controls to adjust AI parameters.
-   **UI Components (`ui.tsx`)**: A set of reusable, stateless components (`Button`, `Card`, `Badge`, `ProgressBar`).

## 5. Technology Stack

-   **Frontend Framework**: React
-   **AI Integration**: `@google/genai` SDK for the Google Gemini API.
-   **AI Model**: `gemini-2.5-flash`
-   **Styling**: Tailwind CSS
-   **Markdown Rendering**: `remarkable`
-   **Syntax Highlighting**: `Prism.js`
-   **File Archiving**: `JSZip`
-   **Icons**: `lucide-react`