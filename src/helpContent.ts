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
-   **DFMA & FMEA (Critical Design)**: When you initiate the "Critical Design" phase, the AI is required to create two specific sprints: a **Design for Manufacturing and Assembly (DFMA)** sprint to optimize for production, and a **Failure Modes and Effects Analysis (FMEA)** sprint to systematically identify and mitigate potential failures. The mandatory **Design Review** for this phase will then verify the comprehensiveness of these analyses.
-   **Verification & Validation (Testing)**: The "Testing" phase is split into two required documents:
    *   **Verification Plan**: Confirms you built the product correctly according to the design specifications.
    *   **Validation Plan**: Confirms you built the right product that meets the user's needs.

## 4. Tips for Success

-   **Garbage In, Garbage Out**: The quality of the AI's output is highly dependent on the quality of your input. Write clear, detailed, and unambiguous requirements and constraints.
-   **Iterate**: Don't expect the first generated output to be perfect. Use the "Regenerate" button and adjust tuning controls. Think of it as a brainstorming session with your AI partner.
-   **Use the Edit Function**: The AI provides a strong first draft. Use the edit feature to refine the details, add specific proprietary information, and ensure it meets your organization's standards.
-   **Context is Key**: Remember that each new phase generation uses the *most recently completed* phase as context. Ensure a phase is truly complete and accurate before marking it as such.

## 5. API Key Management

This application is designed to run entirely in your browser, meaning it does not have a traditional backend server to store user data or API keys. To function, it requires a valid Google Gemini API key to make calls to the AI model. The application provides a flexible and secure user interface to manage this, offering two distinct methods for API access.

### The API Key Access UI

On the landing page, there is a dedicated section titled **"API Key Access."** This UI component is the central hub for authentication and is designed with clarity and choice in mind. It features a tabbed interface, allowing the user to select one of two methods:

-   **Use Promo Code**: This option is for users who may not have their own API key or for demonstration purposes.
-   **Use Your Own API Key**: This option is for users who have their own Google API key and wish to use it.

### Authentication Methods Explained

#### Method A: Promo Code

-   **How it works**: The user selects the "Use Promo Code" tab, which presents a single password input field. If they enter the correct, hard-coded promo code (\`rm2214ri\`), the application initializes the Gemini API client using a built-in API key that is part of the project's environment.
-   **User Experience**: This is the simplest path. The user enters the code, clicks "Validate," and upon success, receives a confirmation toast message. The application is then fully unlocked. If the code is incorrect, an error message is shown.

#### Method B: User-Provided API Key

-   **How it works**: When a user selects the "Use Your Own API Key" tab, they are presented with a password input field (to obscure the key visually), an explanation, and a direct link to the Google AI Studio where they can generate their own free key.
-   **Validation Process**: This is a key part of the user experience. When a user enters their key and clicks "Validate & Use Key," the application performs a crucial step: it sends a minimal, low-cost test request to the Gemini API using that key.
    -   **If the test succeeds**: It confirms the key is valid and functional. A success message is displayed, and the application is unlocked. The provided key is then stored in memory for the current session and used for all subsequent AI-powered actions.
    -   **If the test fails**: The API call will return an error (e.g., authentication failure). The application catches this error and displays an informative message to the user, telling them the key is invalid.
-   **User Experience**: This immediate validation prevents user frustration. Instead of discovering their key is wrong halfway through a research step, they get instant feedback, ensuring they only proceed once the connection to the Gemini service is confirmed.

### Security and State Management

-   **Security**: The user-provided API key is handled securely. It is only held in the application's JavaScript memory for the duration of the browser session. It is not stored in \`localStorage\`, cookies, or the IndexedDB database, ensuring it does not persist on the user's machine after they close the tab.
-   **UI Gating**: The application's state (\`isKeyValidated\`) tracks whether a valid key has been provided. Core functions like starting a new experiment or navigating to the dashboard are disabled until this state is true. If a user attempts an action without a validated key, a warning message is shown, and the page automatically scrolls them to the "API Key Access" section, guiding them to complete the required step.
`;