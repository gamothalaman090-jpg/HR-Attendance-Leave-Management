/**
 * Announcement Service — Mock CRUD for company announcements with localStorage persistence.
 */
import { sleep } from '@/utils/helpers';

const STORAGE_KEY = 'nini-announcements';

const DEFAULT_ANNOUNCEMENTS = [
  {
    id: 'ANN-2',
    title: 'Upcoming Team Building Event',
    content: 'Mark your calendars! Our annual team building event is scheduled for next month. Details on venue and activities will be shared soon.',
    date: new Date('2026-05-17T12:00:00Z').toISOString(),
    author: 'HR Team',
    category: 'Event',
    priority: 'normal',
  }
];

const getStoredAnnouncements = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    // If it contains the old General announcement (ANN-1), reset it
    if (parsed.some(ann => ann.id === 'ANN-1')) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ANNOUNCEMENTS));
      return DEFAULT_ANNOUNCEMENTS;
    }
    return parsed;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ANNOUNCEMENTS));
  return DEFAULT_ANNOUNCEMENTS;
};

const saveAnnouncements = (announcements) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(announcements));
};

export const announcementService = {
  /** Get all announcements */
  async getAll() {
    await sleep(400);
    const announcements = getStoredAnnouncements();
    // Sort by newest first
    return announcements.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  /** Create a new announcement */
  async create(announcementData) {
    await sleep(500);
    const announcements = getStoredAnnouncements();
    const newAnnouncement = {
      id: `ANN-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString(),
      ...announcementData,
    };
    announcements.push(newAnnouncement);
    saveAnnouncements(announcements);
    return newAnnouncement;
  },

  /** Delete an announcement by ID */
  async delete(id) {
    await sleep(400);
    const announcements = getStoredAnnouncements();
    const filtered = announcements.filter((a) => a.id !== id);
    if (filtered.length === announcements.length) return false;
    saveAnnouncements(filtered);
    return true;
  }
};

export default announcementService;
