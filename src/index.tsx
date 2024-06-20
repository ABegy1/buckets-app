import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/app'; // Adjust the path as needed

const container = document.getElementById('root');
const root = createRoot(container!); // The exclamation mark (!) is a non-null assertion operator

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
