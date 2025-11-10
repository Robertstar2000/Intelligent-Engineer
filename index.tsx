import React from 'react';
import ReactDOM from 'react-dom/client';
import { ProjectProvider } from './src/context/ProjectContext';
import { App } from './src/App';

const AppWrapper = () => {
    return (
        <ProjectProvider>
            <App />
        </ProjectProvider>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);