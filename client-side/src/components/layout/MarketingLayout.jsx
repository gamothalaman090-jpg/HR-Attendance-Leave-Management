import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * MarketingLayout — Wraps public pages with Navbar + Footer.
 */
export default function MarketingLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-bg transition-colors duration-base">
      <Navbar />
      <main className="flex-1 relative z-0">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
