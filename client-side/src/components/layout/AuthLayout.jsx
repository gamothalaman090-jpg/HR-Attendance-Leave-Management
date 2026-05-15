import { Outlet, Link } from 'react-router-dom';
import { BRAND } from '@/utils/constants';
import ScrollToTop from '@/components/common/ScrollToTop';

/**
 * AuthLayout — Split-screen layout for login/signup/forgot-password pages.
 * Left: Brand illustration panel | Right: Form panel
 */
export default function AuthLayout() {
  return (
    <div className="min-h-screen flex bg-bg transition-colors duration-base">
      <ScrollToTop />
      {/* Brand Panel — hidden on mobile, visible on lg+ */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0A0A0B]">
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-primary/20 blur-[120px] mix-blend-screen animate-pulse" />
          <div className="absolute top-[40%] -right-[20%] w-[60%] h-[60%] rounded-full bg-secondary/20 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute -bottom-[20%] left-[20%] w-[80%] h-[80%] rounded-full bg-accent/20 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDelay: '4s' }} />
        </div>

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PHBhdGggZD0iTTAgMGgyNHYyNEgwem0xIDF2MjJoMjJWMXptMCAwaDIydjIySDF6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+PC9zdmc+')] opacity-50" />

        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 h-full text-white">
          <Link to="/" className="flex flex-col items-center group transition-all duration-base">
            <div className="relative mb-10">
              {/* Glow effect behind the logo box */}
              <div className="absolute inset-0 bg-primary/40 rounded-[28px] blur-2xl group-hover:bg-primary/60 transition-colors duration-base" />

              {/* Premium Glass Box for Logo */}
              <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[28px] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] group-hover:-translate-y-2 transition-transform duration-500 ease-out">
                {/* Subtle top glare */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <img
                  src={BRAND.logo}
                  alt={BRAND.name}
                  className="w-24 h-24 object-contain filter drop-shadow-lg"
                />
              </div>
            </div>
          </Link>

          <h2 className="text-h3 font-heading font-bold text-white mb-4 tracking-tight text-center">
            Elevate your workspace
          </h2>

          <p className="text-body text-white/60 text-center max-w-md text-balance leading-relaxed mb-12">
            {BRAND.description}
          </p>

          {/* Premium Floating Stats */}
          <div className="grid grid-cols-2 gap-5 max-w-sm w-full">
            <div className="relative group overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 rounded-[20px] p-6 text-center hover:bg-white/10 transition-colors duration-base shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 text-h3 font-heading font-bold text-white mb-1">2.5k+</div>
              <div className="relative z-10 text-body-sm text-white/50 font-medium uppercase tracking-wider">Active Teams</div>
            </div>

            <div className="relative group overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 rounded-[20px] p-6 text-center hover:bg-white/10 transition-colors duration-base shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 text-h3 font-heading font-bold text-white mb-1">99.9%</div>
              <div className="relative z-10 text-body-sm text-white/50 font-medium uppercase tracking-wider">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo — visible only on mobile */}
          <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="inline-flex flex-col items-center">
              <img src={BRAND.logo} alt={BRAND.name} className="w-20 h-20 object-contain shadow-glow-primary" />
            </Link>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
}
