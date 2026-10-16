import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initAnalytics } from './services/analytics';
import './index.css';

initAnalytics();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// When embedded in an iframe on elevatepfs.com, tell the parent page how tall
// the calculator is so it can resize the frame (no inner scrollbar).
// See README > "Embedding on elevatepfs.com" for the parent-page snippet.
if (window.parent !== window) {
  const postHeight = () =>
    window.parent.postMessage(
      { type: 'elevatepfs-calculator:height', height: Math.ceil(document.body.getBoundingClientRect().height) },
      '*'
    );
  new ResizeObserver(postHeight).observe(document.body);
  window.addEventListener('load', postHeight);
}
