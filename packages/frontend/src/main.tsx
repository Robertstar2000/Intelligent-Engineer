import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppRouter } from './AppRouter';
import { ThemeProvider } from './theme';
import './styles/responsive.css';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark">
      <AppRouter />
    </ThemeProvider>
  </React.StrictMode>
);