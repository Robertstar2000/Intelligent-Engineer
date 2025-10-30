import React from 'react';
import ReactDOM from 'react-dom/client';
import { ProjectProvider } from './src/context/ProjectContext';
import { useTheme } from './src/hooks/useTheme';
import { App } from './src/App';

const AppWrapper = () => {
    const [theme, setTheme] = useTheme();
    return (
        <ProjectProvider theme={theme as string} setTheme={setTheme as (theme: string) => void}>
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
