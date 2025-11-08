import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css';
import 'highlight.js/styles/github-dark.css';
import 'katex/dist/katex.min.css';
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider>
      <App />
    </MantineProvider>
  </React.StrictMode>
);