
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ProjectProvider } from './src/context/ProjectContext';
import { App } from './src/App';

const AppWrapper = () => {
    return (
        <ProjectProvider>
            <App />
        </ProjectProvider>
    );
};

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <AppWrapper />
      </React.StrictMode>
    );
}
