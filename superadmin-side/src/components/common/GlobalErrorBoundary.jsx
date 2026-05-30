/**
 * Name: GlobalErrorBoundary.jsx
 * Intercepts superadmin console runtime rendering exceptions and presents our gorgeous ErrorPage.
 */

import { ErrorBoundary } from 'react-error-boundary';
import ErrorPage from '@/pages/ErrorPage';

export default function GlobalErrorBoundary({ children }) {
  const handleError = (error, info) => {
    if (import.meta.env.DEV) {
      console.error('Superadmin GlobalErrorBoundary caught:', error, info);
    }
  };

  return (
    <ErrorBoundary
      FallbackComponent={({ error, resetErrorBoundary }) => (
        <ErrorPage error={error} resetErrorBoundary={resetErrorBoundary} />
      )}
      onError={handleError}
      onReset={() => {
        // Soft reload or cache reset can be integrated here
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
