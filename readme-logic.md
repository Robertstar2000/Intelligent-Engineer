
# Application Logic Outline

This document outlines the logical flow of the Intelligent Engineering Partner application in a human-readable format. Indentation is used to represent nesting, loops, and conditional branches.

---

### I. Application Initialization (`EngineeringPartnerApp`)

- **Start Application**
  - Initialize state variables:
    - `currentView`: Determines which page is visible (defaults to 'landing').
    - `currentProject`: Holds all project data (defaults to `null`).
    - `theme`: Manages light/dark mode.
    - `toast`: Manages success/error notifications.
  - **Render View based on `currentView` state:**
    - `IF currentView == 'landing'`: Show `LandingPage`.
    - `IF currentView == 'wizard'`: Show `ProjectWizard`.
    - `IF currentView == 'dashboard'`: Show `Dashboard`.
    - `IF currentView == 'phase'`: Show `PhaseView` for the selected phase.
    - `IF currentView == 'documents'`: Show `DocumentsPage`.

---

### II. Project Creation Flow

- **`LandingPage`**
  - User clicks "Start New Project".
  - **Action**: Set `currentView` to 'wizard'.

- **`ProjectWizard`**
  - A 4-step modal guides the user.
    - **Step 1:** Get Project Name & Development Mode.
    - **Step 2:** Get Project Requirements.
    - **Step 3:** Get Project Constraints.
    - **Step 4:** Get up to 3 Engineering Disciplines.
  - User clicks "Create Project".
  - **Action**:
    1. A new `Project` object is created with a predefined 7-phase structure.
    2. Each phase is initialized with its name, description, status, tuning settings, and specific workflow requirements (e.g., `designReview: true`).
    3. Set the new object as `currentProject`.
    4. Set `currentView` to 'dashboard'.

---

### III. Main Dashboard Logic (`Dashboard`)

- Displays an overview of the `currentProject`.
- **Render Phase List**:
  - Find the index of the first phase that is NOT 'completed'. Let's call it `firstIncompleteIndex`.
  - **LOOP** through each `phase` in `project.phases`:
    - Display the phase's name, description, and status icon.
    - **Locking Logic**:
      - `IF phase.index > firstIncompleteIndex`:
        - The phase is rendered as "locked" and is not clickable.
      - `ELSE`:
        - The phase is clickable.
    - When an unlocked phase is clicked:
      - **Action**:
        1. Set `selectedPhaseIndex` to the clicked phase's index.
        2. Set `currentView` to 'phase'.

---

### IV. Core Phase Logic (`PhaseView`)

This is the most complex component, with logic that adapts based on the current phase's configuration.

- **Check `phase.status`**:
  - `IF status == 'in-review'`:
    1. Display the read-only final document for review.
    2. Display the AI-generated `DesignReviewChecklist`.
    3. **LOOP** through each `item` in the checklist:
       - Display the item text with a checkbox.
    4. "Finalize Review" button is disabled until all items are checked.
    5. On "Finalize Review" click -> Set phase `status` to 'completed'.

- **Check `phase.name` for special workflow types**:
  - `IF name IN ['Requirements', 'Preliminary Design', 'Testing']` (Multi-Document Workflow):
    1. Display a list of required sub-documents (stored in `phase.sprints`).
    2. **LOOP** through each `doc` in `phase.sprints`:
       - `IF doc.output` does not exist:
         - Show "Generate Document" button.
         - On click -> Call API with a highly specific prompt for that exact document (e.g., "Generate a formal Trade Study..."). The prompt includes the output of the *previous document in the same phase* as context.
       - `IF doc.output` exists:
         - Show the generated content with "Edit" and "Regenerate" buttons.
    3. "Mark Phase Complete" / "Commit for Design Review" button is disabled until all `docs` are completed.
    4. On click -> Merge all `doc.output`s into the main `phase.output` and update phase status.

  - `ELSE IF name == 'Critical Design'` (Sprint-Based Workflow):
    1. `IF phase.output` does not exist (first entry):
       - Show "Generate Spec & Sprints" button.
       - On click -> Call API with a prompt that requests a JSON response containing a preliminary specification and a list of sprints (which MUST include DFMA and FMEA).
    2. `IF phase.output` exists:
       - Display the main specification (which gets updated over time).
       - **LOOP** through each `sprint` in `phase.sprints`:
         - `IF sprint.output` does not exist:
           - Show "Generate Spec & Deliverables" button.
           - On click -> Call API to generate content for just that sprint (using a special FMEA prompt if applicable).
         - `IF sprint.output` exists:
           - Display sprint content.
           - Show "Accept & Merge" button.
           - On click -> Append the `sprint.output` to the main `phase.output` and mark the sprint as 'completed'.
    3. "Mark Phase Complete" / "Commit for Design Review" is disabled until all sprints are 'completed'.

  - `ELSE` (Standard Workflow for phases like Launch, Operation, etc.):
    1. Display `TuningControls` for the user to adjust.
    2. `IF phase.output` does not exist:
       - Show "Generate Output with AI" button.
       - On click -> Call API with a prompt that includes project requirements, constraints, tuning settings, and the output from the *most recently completed phase*.
    3. `IF phase.output` exists:
       - Show the generated content with "Edit" and "Regenerate" buttons.
    4. Show "Mark Phase Complete" button.

---

### V. Document Management & Exports (`DocumentsPage`)

- Displays a list of all phases that have generated content.
- Provides a "Download .md" button for each document.
- **Project Export Functions**:
  - **Generate Vibe/Simulation/Summary/PM Data Pack**:
    1. Gathers the *entirety* of the project's generated documentation to create a full context.
    2. Selects a specific system prompt based on the export type (e.g., "You are an AI that creates prompts for other AIs...").
    3. Makes an API call to Gemini to synthesize the context into the desired format (e.g., a "vibe coding prompt" or a structured JSON data pack).
    4. Triggers a browser download of the result.
  - **Download All as .zip**:
    1. First, makes an API call to generate a new `Project_Summary.md` file.
    2. Initializes the JSZip library in the browser.
    3. **LOOP** through each `phase` in `project.phases`:
       - `IF` the phase has generated content:
         - Create a new folder in the zip archive (e.g., `02_Preliminary_Design/`).
         - Add the main `phase.output` as a file.
         - **LOOP** through each `sprint` in the phase:
           - `IF` the sprint has generated content:
             - Add the `sprint.output` as a file in the phase folder.
    4. Generates the `.zip` file blob and triggers a browser download.

---

### Notes: Problems & Potential Improvements

-   **Completed Tasks**:
    -   **[DONE] State Management Complexity**: Mitigated by adopting React's Context API (`ProjectContext`) to provide project state globally, reducing prop drilling.
    -   **[DONE] Component Monoliths**: `PhaseView.tsx` has been refactored into a router that renders smaller, specialized workflow components (`StandardPhaseWorkflow`, `MultiDocPhaseWorkflow`, etc.), improving separation of concerns.
    -   **[DONE] Lack of Persistence**: Implemented `localStorage` via `ProjectContext` to save the `currentProject` state, allowing users to resume work after a browser refresh.
    -   **[DONE] Outdated Help Content**: The `helpContent.ts` file has been updated to accurately reflect the current, simplified API key handling mechanism.
    -   **[DONE] Abstract API Logic**: A dedicated service module (`src/services/geminiService.ts`) has been created to centralize all prompt construction and API calls, cleaning up components.

-   **Potential Future Improvements**:
    -   **More Robust State Manager**: For even more complex state interactions, a library like Zustand could be considered to further simplify state updates and selectors.
    -   **Error Boundaries**: Implement React Error Boundaries to gracefully handle rendering errors in components without crashing the entire application.
    -   **Unit & Integration Testing**: Add a testing framework like Jest and React Testing Library to write tests for key components and service functions, improving application stability.
    -   **UI/UX Enhancements**: Add more loading indicators, optimistic UI updates, and smoother transitions to improve the user experience during long-running AI generation tasks.
