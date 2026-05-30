import { useState, useMemo, useEffect } from 'react';
import Meta from '@/components/common/Meta';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { leaveService } from '@/services/leaveService';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/helpers';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const EVENT_COLORS = {
  annual: { bg: 'bg-primary/15', text: 'text-primary', dot: 'bg-primary' },
  sick: { bg: 'bg-danger/15', text: 'text-danger', dot: 'bg-danger' },
  personal: { bg: 'bg-secondary/15', text: 'text-secondary', dot: 'bg-secondary' },
};

/* Static company holidays */
const HOLIDAYS = [
  { date: '2026-01-01', label: 'New Year' },
  { date: '2026-05-01', label: 'Labour Day' },
  { date: '2026-05-15', label: 'Pay Day Holiday' },
  { date: '2026-07-04', label: 'Independence Day' },
  { date: '2026-12-25', label: 'Christmas' },
];

export default function CalendarPage() {
  const { user } = useAuth();
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const isHR = ['hr', 'admin'].some(r => user?.role?.toLowerCase().includes(r)) || user?.role?.toLowerCase() === 'superadmin';

  useEffect(() => {
    let active = true;
    const fetchLeaves = async () => {
      try {
        const res = await (isHR ? leaveService.getAll({ limit: 1000 }) : leaveService.getMyLeaves({ limit: 1000 }));
        if (active) {
          setLeaveRequests(res.data || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch calendar leaves', err);
        if (active) setLoading(false);
      }
    };
    fetchLeaves();
    return () => { active = false; };
  }, [isHR]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const navigate = (dir) => {
    setCurrentDate(new Date(year, month + dir, 1));
    setSelectedDay(null);
  };

  /* ── Build event map: date → array of events ── */
  const eventMap = useMemo(() => {
    const map = {};

    // Leaves (approved + pending)
    leaveRequests
      .filter((l) => l.status === 'approved' || l.status === 'pending')
      .forEach((leave) => {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const key = d.toISOString().split('T')[0];
          if (!map[key]) map[key] = [];
          map[key].push({
            type: leave.type,
            label: `${leave.employeeName} — ${leave.type.charAt(0).toUpperCase() + leave.type.slice(1)} Leave`,
            status: leave.status,
          });
        }
      });

    // Holidays
    HOLIDAYS.forEach((h) => {
      if (!map[h.date]) map[h.date] = [];
      map[h.date].push({ type: 'holiday', label: h.label, status: 'holiday' });
    });

    return map;
  }, [leaveRequests]);

  /* ── Selected day events ── */
  const selectedDateStr = selectedDay
    ? `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    : null;
  const selectedEvents = selectedDateStr ? (eventMap[selectedDateStr] || []) : [];

  return (
    <div>
      <Meta title="Calendar" />
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-h2 font-bold mb-1">Team Calendar</h1>
        <p className="text-text-muted text-body">View team availability and scheduled leaves.</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3 bg-surface border border-border rounded-[16px] p-6">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-[8px] text-text-muted hover:text-text hover:bg-surface-alt transition-colors cursor-pointer"
              aria-label="Previous month"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="font-heading text-h3 font-bold">
              {MONTHS[month]} {year}
            </h2>
            <button
              onClick={() => navigate(1)}
              className="p-2 rounded-[8px] text-text-muted hover:text-text hover:bg-surface-alt transition-colors cursor-pointer"
              aria-label="Next month"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-caption font-semibold text-text-muted py-2">{d}</div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] sm:min-h-[100px]" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const events = eventMap[dateStr] || [];
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const isSelected = selectedDay === day;
              const dayOfWeek = new Date(year, month, day).getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    'min-h-[80px] sm:min-h-[100px] p-2 rounded-[12px] text-left transition-all duration-300 ease-out cursor-pointer',
                    'border hover:border-primary/40 hover:shadow-card hover:scale-[1.03] hover:-translate-y-0.5',
                    isSelected 
                      ? 'border-primary bg-primary/5 shadow-glow-primary' 
                      : 'border-border/50 hover:bg-surface-alt/30',
                    isToday && 'ring-2 ring-primary/60 border-primary',
                    isWeekend ? 'bg-surface-alt/40' : 'bg-surface',
                  )}
                >
                  <span className={cn(
                    'text-body-sm font-semibold block mb-1.5 transition-colors',
                    isToday ? 'text-primary font-bold' : isWeekend ? 'text-text-muted' : 'text-text',
                  )}>
                    {day}
                  </span>
                  <div className="space-y-0.5">
                    {events.slice(0, 3).map((evt, idx) => {
                      const color = EVENT_COLORS[evt.type] || EVENT_COLORS.annual;
                      return (
                        <div key={idx} className={cn('flex items-center gap-1 px-1 py-0.5 rounded text-[10px] leading-tight truncate', color.bg, color.text)}>
                          <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', color.dot)} />
                          <span className="truncate hidden sm:inline">{evt.label.split(' — ')[0]}</span>
                        </div>
                      );
                    })}
                    {events.length > 3 && (
                      <span className="text-[10px] text-text-muted">+{events.length - 3} more</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar — Day details */}
        <div className="bg-surface border border-border rounded-[16px] p-5">
          <h3 className="font-heading text-h4 font-bold mb-4">
            {selectedDay
              ? `${MONTHS[month]} ${selectedDay}, ${year}`
              : 'Select a Day'
            }
          </h3>

          {!selectedDay ? (
            <p className="text-body-sm text-text-muted">Click a day on the calendar to see events.</p>
          ) : selectedEvents.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-h3 mb-2">🎉</div>
              <p className="text-body-sm text-text-muted">No events scheduled.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedEvents.map((evt, idx) => {
                const color = EVENT_COLORS[evt.type] || EVENT_COLORS.annual;
                return (
                  <div key={idx} className={cn('p-3 rounded-[10px] border-l-3', color.bg)}>
                    <div className={cn('text-body-sm font-medium', color.text)}>{evt.label}</div>
                    <div className="text-caption text-text-muted capitalize mt-0.5">
                      {evt.status === 'pending' ? '⏳ Pending approval' : evt.status === 'holiday' ? '🎄 Company Holiday' : '✅ Approved'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-border">
            <h4 className="text-caption font-semibold text-text-muted mb-2 uppercase tracking-wider">Legend</h4>
            <div className="space-y-1.5">
              {Object.entries(EVENT_COLORS).map(([key, { dot }]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={cn('w-3 h-3 rounded-full', dot)} />
                  <span className="text-caption text-text-muted capitalize">{key}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
