import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Lock, Plus, Trash2, ArrowRight, ArrowLeft, Building2, Users, Megaphone, Sparkles, Send, AlertTriangle } from 'lucide-react';
import { useGsap } from '@/hooks/useGsap';
import { useAuth } from '@/context/AuthContext';
import { employeeService } from '@/services/employeeService';
import { announcementService } from '@/services/announcementService';
import { cn } from '@/utils/helpers';

const PLANS = [
  { id: 'starter', name: 'Starter', price: '$0', desc: 'Core HR features for small, agile teams.', active: true },
  { id: 'pro', name: 'Professional', price: '$49', desc: 'Advanced analytics & custom workflows.', active: false },
  { id: 'enterprise', name: 'Enterprise', price: '$149', desc: 'Dedicated support & infinite scalability.', active: false },
];

const STEP_CONTENT = {
  1: {
    icon: Building2,
    title: 'Select your tier.',
    subtitle: 'Nini grows with you. Start lean and unlock enterprise-grade features as your team scales.',
  },
  2: {
    icon: Users,
    title: 'Bring them aboard.',
    subtitle: 'Your people are everything. Add your core team members to get the directory instantly populated.',
  },
  3: {
    icon: Megaphone,
    title: 'Make some noise.',
    subtitle: 'Draft a welcome broadcast. We will pin this to your new company dashboard for everyone to see.',
  },
  4: {
    icon: Sparkles,
    title: 'Ready for liftoff.',
    subtitle: 'Your workspace is beautifully configured. Welcome to the new standard of team management.',
  }
};

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const leftPaneRef = useRef(null);
  
  // Step 2 State
  const [team, setTeam] = useState([
    { id: '1', name: '', email: '', role: '' },
  ]);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 3 State
  const [announcement, setAnnouncement] = useState({
    title: 'Welcome to our new HR Portal! 🎉',
    content: 'We are thrilled to launch our new leave and attendance management system. Please explore your dashboard and let HR know if you have any questions.',
  });

  useGsap((gsapInstance, el) => {
    // Elegant slide up for interactive content
    gsapInstance.fromTo(el.querySelectorAll('.onboard-step-anim'),
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, stagger: 0.05, ease: 'power3.out', clearProps: 'all' }
    );
    
    // Abstract left pane text fade
    gsapInstance.fromTo(el.querySelectorAll('.pane-text-anim'),
      { opacity: 0, filter: 'blur(10px)' },
      { opacity: 1, filter: 'blur(0px)', duration: 0.8, ease: 'power2.out', clearProps: 'all' }
    );
  }, [step]);

  const validateTeam = (teamList) => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    teamList.forEach((member, index) => {
      const memberErrors = {};
      const hasAnyField = member.name.trim() || member.email.trim() || member.role.trim();
      
      if (hasAnyField) {
        if (!member.name.trim()) {
          memberErrors.name = 'Name is required';
        }
        if (!member.email.trim()) {
          memberErrors.email = 'Email is required';
        } else if (!emailRegex.test(member.email.trim())) {
          memberErrors.email = 'Invalid email format';
        }
        if (!member.role.trim()) {
          memberErrors.role = 'Role is required';
        }
      }
      
      if (Object.keys(memberErrors).length > 0) {
        newErrors[index] = memberErrors;
      }
    });
    
    return newErrors;
  };

  const handleNext = () => {
    if (isSubmitting) return;
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (isSubmitting) return;
    if (step > 1) setStep(step - 1);
  };

  const completeOnboarding = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      for (const member of team) {
        if (member.name && member.email) {
          let dept = 'Engineering';
          const roleLower = (member.role || '').toLowerCase();
          if (roleLower.includes('design') || roleLower.includes('art') || roleLower.includes('ux') || roleLower.includes('ui') || roleLower.includes('creative')) {
            dept = 'Design';
          } else if (roleLower.includes('market') || roleLower.includes('pr') || roleLower.includes('social') || roleLower.includes('growth')) {
            dept = 'Marketing';
          } else if (roleLower.includes('sale') || roleLower.includes('bizdev')) {
            dept = 'Sales';
          } else if (roleLower.includes('hr') || roleLower.includes('human') || roleLower.includes('recruit') || roleLower.includes('people')) {
            dept = 'Human Resources';
          } else if (roleLower.includes('finance') || roleLower.includes('account') || roleLower.includes('tax')) {
            dept = 'Finance';
          } else if (roleLower.includes('product') || roleLower.includes('owner') || roleLower.includes('pm')) {
            dept = 'Product';
          } else if (roleLower.includes('operation') || roleLower.includes('ops') || roleLower.includes('support')) {
            dept = 'Operations';
          }
          await employeeService.create({
            name: member.name,
            email: member.email,
            role: member.role || 'Employee',
            department: dept
          });
        }
      }
      
      await announcementService.create({
        title: announcement.title,
        content: announcement.content,
        category: 'General',
        priority: 'high',
        author: 'HR Manager'
      });
      
      updateUser({ onboarded: true });
      navigate('/app');
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const updateTeamMember = (index, field, value) => {
    if (isSubmitting) return;
    const newTeam = [...team];
    newTeam[index][field] = value;
    setTeam(newTeam);
    
    const validationErrors = validateTeam(newTeam);
    setErrors(validationErrors);
  };

  const addTeamMember = () => {
    if (isSubmitting) return;
    const newTeam = [...team, { id: Date.now().toString(), name: '', email: '', role: '' }];
    setTeam(newTeam);
    const validationErrors = validateTeam(newTeam);
    setErrors(validationErrors);
  };

  const removeTeamMember = (index) => {
    if (isSubmitting) return;
    const newTeam = team.filter((_, i) => i !== index);
    setTeam(newTeam);
    const validationErrors = validateTeam(newTeam);
    setErrors(validationErrors);
  };

  const hasErrors = Object.keys(errors).length > 0;
  const isStep2Valid = !hasErrors;
  const isStep3Valid = announcement.title.trim().length > 0 && announcement.content.trim().length > 0;

  const isTitleEmpty = announcement.title.trim() === "";
  const isContentEmpty = announcement.content.trim() === "";
  const showStep3Warning = isTitleEmpty || isContentEmpty;

  const canContinue = 
    step === 1 ? true :
    step === 2 ? isStep2Valid :
    step === 3 ? isStep3Valid :
    true;

  const ActiveIcon = STEP_CONTENT[step].icon;

  return (
    <div className="min-h-screen bg-background flex font-sans selection:bg-primary/30">
      
      {/* LEFT PANE - Editorial & Aesthetic */}
      <div 
        ref={leftPaneRef}
        className="hidden lg:flex w-[45%] xl:w-[40%] bg-surface-alt relative overflow-hidden flex-col justify-between p-12 border-r border-border"
      >
        {/* Dynamic Abstract Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/10 mix-blend-multiply" />
        <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />
        
        {/* Glowing Orbs */}
        <div className={cn(
          "absolute w-[400px] h-[400px] rounded-full blur-[100px] transition-all duration-1000 ease-in-out pointer-events-none",
          step === 1 ? "bg-primary/20 top-10 left-10" : 
          step === 2 ? "bg-emerald-500/20 top-1/2 -right-20" :
          step === 3 ? "bg-amber-500/20 bottom-10 left-1/4" :
          "bg-blue-500/20 inset-0 m-auto"
        )} />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary text-white rounded-[10px] flex items-center justify-center font-bold font-heading text-lg shadow-glow-primary">
            N
          </div>
          <span className="font-heading font-bold text-xl tracking-tight text-text">Nini HR</span>
        </div>

        <div className="relative z-10 my-auto">
          <div className="mb-8 w-16 h-16 rounded-[16px] bg-background border border-border shadow-sm flex items-center justify-center text-primary pane-text-anim">
            <ActiveIcon strokeWidth={1.5} size={32} />
          </div>
          <h1 className="text-5xl xl:text-6xl font-heading font-extrabold tracking-tight text-text leading-[1.1] mb-6 pane-text-anim">
            {STEP_CONTENT[step].title}
          </h1>
          <p className="text-lg text-text-muted max-w-md leading-relaxed pane-text-anim">
            {STEP_CONTENT[step].subtitle}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="relative z-10 flex gap-3 items-center mt-12">
          {[1, 2, 3, 4].map(i => (
            <div 
              key={i} 
              className={cn(
                "h-1.5 rounded-full transition-all duration-700 ease-out",
                i === step ? "w-12 bg-primary shadow-glow-primary" : i < step ? "w-6 bg-text/20" : "w-6 bg-border"
              )} 
            />
          ))}
          <span className="ml-4 text-sm font-semibold tracking-wider text-text-muted uppercase">
            Step {step} of 4
          </span>
        </div>
      </div>

      {/* RIGHT PANE - Interactive Form */}
      <div className="flex-1 flex flex-col items-center justify-center relative p-6 sm:p-12 lg:p-24 overflow-y-auto custom-scrollbar">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="lg:hidden w-full max-w-2xl mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary text-white rounded-[8px] flex items-center justify-center font-bold font-heading text-sm">
              N
            </div>
            <span className="font-heading font-bold text-lg text-text">Nini HR</span>
          </div>
          <div className="text-sm font-medium text-text-muted">
            {step} / 4
          </div>
        </div>

        <div className="w-full max-w-2xl mx-auto flex flex-col min-h-[500px]">
          
          {/* STEP 1: PLAN SELECTION */}
          {step === 1 && (
            <div className="flex-1 flex flex-col justify-center">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {PLANS.map((plan) => (
                  <div 
                    key={plan.id} 
                    className={cn(
                      "onboard-step-anim relative p-6 rounded-[20px] transition-all duration-500 flex flex-col cursor-pointer",
                      plan.active 
                        ? "bg-surface border-2 border-primary shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-4 ring-primary/10" 
                        : "bg-surface-alt/50 border border-border/50 hover:border-border hover:bg-surface-alt grayscale opacity-70"
                    )}
                  >
                    {!plan.active && (
                      <div className="absolute top-4 right-4 text-text-muted/50">
                        <Lock size={16} />
                      </div>
                    )}
                    <h3 className="font-heading font-semibold text-lg text-text mb-1">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-2xl font-bold tracking-tight text-text">{plan.price}</span>
                      <span className="text-sm font-medium text-text-muted">/mo</span>
                    </div>
                    <p className="text-sm text-text-muted leading-relaxed flex-1">{plan.desc}</p>
                    {plan.active && (
                      <div className="mt-6 flex items-center justify-center gap-2 text-primary font-semibold text-sm bg-primary/10 py-2.5 rounded-[10px]">
                        <Check size={16} strokeWidth={2.5} /> Selected
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-center text-sm text-text-muted mt-8 onboard-step-anim">
                You can upgrade to a premium tier at any time from your billing settings.
              </p>
            </div>
          )}

          {/* STEP 2: TEAM SETUP */}
          {step === 2 && (
            <div className="flex-1 flex flex-col justify-center w-full">
              {hasErrors && (
                <div className="mb-6 p-4 rounded-[16px] bg-danger/5 border border-danger/20 backdrop-blur-md shadow-[0_8px_32px_0_rgba(239,68,68,0.06)] flex items-start gap-3 animate-fade-in select-none">
                  <div className="p-2 rounded-[10px] bg-danger/10 text-danger flex-shrink-0">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <h4 className="text-body-sm font-semibold text-danger mb-0.5 font-heading">Please verify team details</h4>
                    <p className="text-caption text-danger/80 leading-relaxed font-body">
                      Make sure that every member who has started typing has a valid name, email address, and role.
                    </p>
                  </div>
                </div>
              )}
              <div className="space-y-4 w-full">
                {team.map((member, index) => {
                  const memberErrors = errors[index] || {};
                  const hasRowErrors = Object.keys(memberErrors).length > 0;
                  return (
                    <div 
                      key={member.id} 
                      className={cn(
                        "onboard-step-anim group flex flex-col gap-3 p-5 bg-surface border rounded-[16px] shadow-sm hover:shadow-md transition-all focus-within:ring-2 focus-within:ring-offset-2",
                        hasRowErrors 
                          ? "border-danger/40 bg-danger/[0.01] focus-within:border-danger focus-within:ring-danger/10" 
                          : "border-border hover:border-primary/30 focus-within:border-primary/50 focus-within:ring-primary/10"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "hidden sm:flex w-10 h-10 rounded-full bg-surface-alt border border-border items-center justify-center font-bold text-text-muted flex-shrink-0 transition-colors",
                          hasRowErrors ? "bg-danger/10 text-danger border-danger/20" : "group-focus-within:bg-primary/10 group-focus-within:text-primary"
                        )}>
                          {member.name ? member.name.charAt(0) : '?'}
                        </div>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {/* Name Input */}
                          <div className="flex flex-col gap-1 w-full">
                            <div className={cn(
                              "border-b pb-1.5 transition-all duration-300 w-full",
                              memberErrors.name 
                                ? "border-danger" 
                                : "border-border/60 focus-within:border-primary"
                            )}>
                              <input 
                                type="text" 
                                placeholder="Full Name" 
                                value={member.name} 
                                onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                                disabled={isSubmitting}
                                className="w-full bg-transparent border-none text-body font-medium text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-0 px-0 py-1 disabled:opacity-50"
                              />
                            </div>
                            {memberErrors.name && (
                              <span className="text-[11px] font-medium text-danger transition-all animate-fade-in flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse flex-shrink-0" />
                                {memberErrors.name}
                              </span>
                            )}
                          </div>

                          {/* Email Input */}
                          <div className="flex flex-col gap-1 w-full">
                            <div className={cn(
                              "border-b pb-1.5 transition-all duration-300 w-full",
                              memberErrors.email 
                                ? "border-danger" 
                                : "border-border/60 focus-within:border-primary"
                            )}>
                              <input 
                                type="email" 
                                placeholder="Email Address" 
                                value={member.email} 
                                onChange={(e) => updateTeamMember(index, 'email', e.target.value)}
                                disabled={isSubmitting}
                                className="w-full bg-transparent border-none text-body text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-0 px-0 py-1 disabled:opacity-50"
                              />
                            </div>
                            {memberErrors.email && (
                              <span className="text-[11px] font-medium text-danger transition-all animate-fade-in flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse flex-shrink-0" />
                                {memberErrors.email}
                              </span>
                            )}
                          </div>

                          {/* Role Input */}
                          <div className="flex flex-col gap-1 w-full">
                            <div className={cn(
                              "border-b pb-1.5 transition-all duration-300 w-full",
                              memberErrors.role 
                                ? "border-danger" 
                                : "border-border/60 focus-within:border-primary"
                            )}>
                              <input 
                                type="text" 
                                placeholder="Role" 
                                value={member.role} 
                                onChange={(e) => updateTeamMember(index, 'role', e.target.value)}
                                disabled={isSubmitting}
                                className="w-full bg-transparent border-none text-body text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-0 px-0 py-1 disabled:opacity-50"
                              />
                            </div>
                            {memberErrors.role && (
                              <span className="text-[11px] font-medium text-danger transition-all animate-fade-in flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse flex-shrink-0" />
                                {memberErrors.role}
                              </span>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={() => removeTeamMember(index)}
                          className="text-text-muted hover:text-danger p-2 rounded-full hover:bg-danger/10 transition-colors self-end sm:self-center sm:opacity-0 group-hover:opacity-100 focus:opacity-100 focus-within:opacity-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                
                <button 
                  onClick={addTeamMember}
                  className="onboard-step-anim flex items-center justify-center gap-2 w-full py-5 border-2 border-dashed border-border/60 rounded-[16px] text-text-muted hover:text-text hover:border-text-muted hover:bg-surface-alt transition-all font-medium mt-4"
                >
                  <Plus size={18} /> Add another member
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: ANNOUNCEMENT */}
          {step === 3 && (
            <div className="flex-1 flex flex-col justify-center">
              {showStep3Warning && (
                <div className="mb-6 p-4 rounded-[16px] bg-amber-500/5 border border-amber-500/20 backdrop-blur-md shadow-[0_8px_32px_0_rgba(245,158,11,0.06)] flex items-start gap-3 animate-fade-in select-none">
                  <div className="p-2 rounded-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-500 flex-shrink-0">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <h4 className="text-body-sm font-semibold text-amber-800 dark:text-amber-400 mb-0.5 font-heading">Announcement Draft Incomplete</h4>
                    <p className="text-caption text-amber-600/80 dark:text-amber-400/80 leading-relaxed font-body">
                      {isTitleEmpty && isContentEmpty 
                        ? "Both the subject title and the message body are currently empty. Please fill them out to proceed."
                        : isTitleEmpty 
                          ? "The subject title is empty. Please enter an announcement title to proceed."
                          : "The message body is empty. Please write your welcome message to proceed."
                      }
                    </p>
                  </div>
                </div>
              )}
              <div className="onboard-step-anim w-full bg-surface border border-border rounded-[24px] p-8 shadow-sm flex flex-col gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-500 to-emerald-400" />
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Announcement Subject</label>
                  <input 
                    type="text" 
                    value={announcement.title}
                    onChange={(e) => setAnnouncement({...announcement, title: e.target.value})}
                    className={cn(
                      "w-full bg-transparent border-b-2 pb-3 text-2xl font-heading font-bold text-text focus:outline-none transition-colors placeholder:text-border",
                      announcement.title.trim() === "" 
                        ? "border-danger/40 focus:border-danger" 
                        : "border-border focus:border-primary"
                    )}
                    placeholder="Enter announcement subject"
                  />
                  {announcement.title.trim() === "" && (
                    <span className="text-xs text-danger font-medium mt-1.5 block">Subject cannot be blank</span>
                  )}
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Message Body</label>
                  <textarea 
                    value={announcement.content}
                    onChange={(e) => setAnnouncement({...announcement, content: e.target.value})}
                    className={cn(
                      "w-full flex-1 min-h-[160px] bg-surface-alt border rounded-[12px] p-5 text-body text-text focus:outline-none transition-all resize-none leading-relaxed",
                      announcement.content.trim() === "" 
                        ? "border-danger/40 focus:ring-2 focus:ring-danger/10 focus:border-danger" 
                        : "border-border focus:ring-2 focus:ring-primary/10 focus:border-primary"
                    )}
                    placeholder="Enter message body"
                  />
                  {announcement.content.trim() === "" && (
                    <span className="text-xs text-danger font-medium mt-1.5 block">Message body cannot be blank</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-primary text-sm font-medium">
                  <Send size={14} /> Will be posted to the "General" category immediately.
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: CELEBRATION */}
          {step === 4 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="onboard-step-anim relative mb-12 group">
                <div className="w-28 h-28 bg-surface border-4 border-success rounded-full flex items-center justify-center relative z-10 mx-auto shadow-lg shadow-success/20">
                  <Check size={56} className="text-success stroke-[2.5]" />
                </div>
                {/* Expanding Rings */}
                <div className="absolute inset-0 bg-transparent border-2 border-success rounded-full scale-100 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] opacity-20" />
                <div className="absolute inset-0 bg-success/10 rounded-full scale-[1.6] blur-xl" />
              </div>
              
              <h2 className="onboard-step-anim text-3xl font-heading font-extrabold text-text mb-4 tracking-tight">
                Setup Complete
              </h2>
              <p className="onboard-step-anim text-lg text-text-muted max-w-sm mx-auto mb-10">
                You're ready to start managing your team effortlessly. Let's head to the dashboard.
              </p>
            </div>
          )}

          {/* BOTTOM NAVIGATION ACTIONS */}
          <div className="mt-auto pt-8 flex items-center justify-between w-full">
            {step > 1 && step < 4 ? (
              <button 
                onClick={handleBack}
                className="flex items-center justify-center w-12 h-12 rounded-[12px] text-text-muted hover:text-text hover:bg-surface border border-transparent hover:border-border transition-all"
                title="Go Back"
              >
                <ArrowLeft size={20} />
              </button>
            ) : <div />}

            {step < 4 ? (
              <button 
                onClick={handleNext}
                disabled={!canContinue}
                className={cn(
                  "flex items-center gap-3 px-8 py-4 rounded-[14px] font-semibold text-white bg-primary hover:bg-primary-light shadow-[0_4px_14px_0_rgb(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 transition-all ml-auto",
                  !canContinue && "opacity-50 cursor-not-allowed pointer-events-none hover:translate-y-0 shadow-none hover:shadow-none bg-primary/80"
                )}
              >
                Continue <ArrowRight size={18} strokeWidth={2.5} />
              </button>
            ) : (
              <button 
                onClick={completeOnboarding}
                disabled={isSubmitting}
                className={cn(
                  "onboard-step-anim flex items-center justify-center gap-3 px-10 py-4 rounded-[14px] font-bold text-white bg-primary hover:bg-primary-light shadow-glow-primary hover:-translate-y-0.5 transition-all w-full sm:w-auto mx-auto",
                  isSubmitting && "opacity-60 cursor-not-allowed pointer-events-none hover:translate-y-0 shadow-none"
                )}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
                    Setting up workspace...
                  </>
                ) : (
                  <>
                    Enter Dashboard <ArrowRight size={18} />
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}