import AppRouter from '@/router';
import { ToastContainer } from '@/components/ui';

/**
 * App — Root application component.
 * 
 * The router handles all layout/page rendering.
 * Providers are wrapped in main.jsx.
 * ToastContainer renders the global toast notification stack.
 */
export default function App() {
  return (
    <>
      <AppRouter />
      <ToastContainer />
    </>
  );
}
