import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { NotificationProvider } from '@/context/NotificationContext';
import App from './App';
import '@/styles/index.css';

import GlobalErrorBoundary from '@/components/common/GlobalErrorBoundary';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <GlobalErrorBoundary>
          <ToastProvider>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </ToastProvider>
        </GlobalErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
