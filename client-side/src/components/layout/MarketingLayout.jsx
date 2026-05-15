import { Outlet } from 'react-router-dom';
import PageTransition from '@/components/common/PageTransition';
import Navbar from './Navbar';
import Footer from './Footer';
import ScrollToTop from '@/components/common/ScrollToTop';

/**
 * MarketingLayout — Wraps public pages with Navbar + Footer.
 */
export default function MarketingLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-bg transition-colors duration-base">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1 relative z-0">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <Footer />
    </div>
  );
}
