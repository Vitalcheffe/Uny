import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CognitiveProvider } from './context/CognitiveContext';
import { LanguageProvider } from './context/LanguageContext';
import './lib/i18n';

console.log("🚀 [UNY] Initializing Sovereign Kernel...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("❌ [UNY] Fatal Error: Root element not found.");
} else {
  const root = ReactDOM.createRoot(rootElement);

  try {
    root.render(
      <React.StrictMode>
        <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <LanguageProvider>
              <CognitiveProvider>
                <App />
              </CognitiveProvider>
            </LanguageProvider>
          </AuthProvider>
        </HashRouter>
      </React.StrictMode>
    );
  } catch (err) {
    console.error("❌ [UNY] Neural Crash : Render Fault :", err);
    rootElement.innerHTML = `
      <div style="height: 100vh; background: #f8fafc; display: flex; align-items: center; justify-content: center; font-family: sans-serif; text-align: center; padding: 20px;">
        <div style="background: white; padding: 60px; border-radius: 48px; box-shadow: 0 40px 100px rgba(0,0,0,0.05); max-width: 500px; border: 1px solid #e2e8f0;">
          <h1 style="font-weight: 900; font-style: italic; color: #1a1615; margin-bottom: 24px; text-transform: uppercase; letter-spacing: -2px; font-size: 32px;">Kernel Breach</h1>
          <p style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 4px; line-height: 1.6;">Emergency System Restoration Required.</p>
          <button onclick="window.location.reload()" style="margin-top: 40px; padding: 20px 40px; background: #1a1615; color: white; border: none; border-radius: 24px; font-weight: 900; cursor: pointer; text-transform: uppercase; letter-spacing: 2px; font-size: 10px; transition: all 0.3s;">Restart Sovereign Link</button>
        </div>
      </div>
    `;
  }
}