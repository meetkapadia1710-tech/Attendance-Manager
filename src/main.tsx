import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { FirestoreProvider } from './components/providers/FirestoreProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FirestoreProvider>
      <App />
    </FirestoreProvider>
  </StrictMode>
);
