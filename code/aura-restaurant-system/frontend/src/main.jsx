/**
 * ============================================================
 *  AURA Frontend Entry Point
 * ============================================================
 *  Bootstraps the React app and mounts global providers from App.
 *
 *  [BACKEND INTEGRATION: TODO]
 *  If auth token bootstrap/refresh is added, initialize it here
 *  before rendering <App />.
 * ============================================================
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
