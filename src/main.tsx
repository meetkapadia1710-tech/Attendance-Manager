import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { FirestoreProvider } from './components/providers/FirestoreProvider';
import { AuthProvider } from './components/providers/AuthProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <FirestoreProvider>
        <App />
      </FirestoreProvider>
    </AuthProvider>
  </StrictMode>
);
