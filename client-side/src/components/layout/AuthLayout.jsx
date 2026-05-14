import { Outlet } from 'react-router-dom';

/**
 * AuthLayout — Split-screen layout for login/signup/forgot-password pages.
 * Left: Brand illustration panel | Right: Form panel
 */
export default function AuthLayout() {
  return (
    <div className="min-h-screen flex bg-bg transition-colors duration-base">
      {/* Brand Panel — hidden on mobile, visible on lg+ */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary-dark to-secondary relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-accent/20 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          <h1 className="font-heading text-display font-extrabold mb-4 text-balance">
            Nini
          </h1>
          <p className="text-body-lg text-white/80 text-center max-w-md text-balance">
            Smart HR management for modern teams. Track attendance, manage leaves, and keep your team happy.
          </p>

          {/* Floating stats preview */}
          <div className="mt-12 grid grid-cols-2 gap-4 max-w-sm w-full">
            <div className="bg-white/10 backdrop-blur-sm rounded-[16px] p-4 text-center">
              <div className="text-h3 font-bold">2.5k+</div>
              <div className="text-body-sm text-white/70">Active Teams</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-[16px] p-4 text-center">
              <div className="text-h3 font-bold">99.9%</div>
              <div className="text-body-sm text-white/70">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo — visible only on mobile */}
          <div className="lg:hidden mb-8 text-center">
            <a href="/" className="font-heading text-h2 font-extrabold gradient-text">
              Nini
            </a>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
}
