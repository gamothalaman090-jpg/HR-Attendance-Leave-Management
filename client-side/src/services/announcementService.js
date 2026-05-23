/**
 * Announcement Service — Connects to Node.js/Express/MongoDB backend.
 *
 * User endpoint:  GET /user/announcements
 * Admin endpoints: GET/POST /admin/announcements, DELETE /admin/announcements/:id
 */
import api from './api';

const mapAnnouncement = (a) => {
  if (!a) return null;
  const author = a.author || {};
  return {
    id: a._id,
    title: a.title,
    content: a.content,
    date: a.createdAt || a.date,
    author: author.fullname || author || 'Admin',
    category: a.category || 'General',
    priority: a.priority || 'normal',
  };
};

export const announcementService = {
  /** Get all announcements (tries admin first, falls back to user) */
  async getAll() {
    try {
      const { data: res } = await api.get('/admin/announcements');
      return (res.data || []).map(mapAnnouncement);
    } catch {
      // Fallback for regular users
      const { data: res } = await api.get('/user/announcements');
      return (res.data || []).map(mapAnnouncement);
    }
  },

  /** Create a new announcement (admin) */
  async create(announcementData) {
    const { data: res } = await api.post('/admin/announcements', {
      title: announcementData.title,
      content: announcementData.content,
      category: announcementData.category || 'General',
      priority: announcementData.priority || 'normal',
    });
    return mapAnnouncement(res.data);
  },

  /** Delete an announcement by ID (admin) */
  async delete(id) {
    await api.delete(`/admin/announcements/${id}`);
    return true;
  },
};

export default announcementService;
