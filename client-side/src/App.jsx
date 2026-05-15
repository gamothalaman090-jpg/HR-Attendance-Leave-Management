import AppRouter from '@/router';
import { ToastContainer } from '@/components/ui';

/**
 * App — Root application component.
 */
export default function App() {
  return (
    <>
      <AppRouter />
      <ToastContainer />
    </>
  );
}
