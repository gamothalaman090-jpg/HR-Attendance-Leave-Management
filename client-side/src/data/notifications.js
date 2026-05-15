/**
 * Mock Notifications Data
 */

export const NOTIFICATIONS = [
  {
    id: 'notif-001',
    type: 'leave',
    title: 'New Leave Request',
    message: 'Sarah Chen requested Annual Leave for May 20-22.',
    time: '2026-05-12T10:30:00',
    read: false,
    action: '/app/leave',
  },
  {
    id: 'notif-002',
    type: 'leave',
    title: 'New Leave Request',
    message: 'Maria Lopez requested Personal Leave for May 25-26.',
    time: '2026-05-14T14:15:00',
    read: false,
    action: '/app/leave',
  },
  {
    id: 'notif-003',
    type: 'attendance',
    title: 'Late Clock-In',
    message: 'Ryan O\'Connor clocked in at 9:32 AM today.',
    time: '2026-05-15T09:35:00',
    read: true,
    action: '/app/attendance',
  },
  {
    id: 'notif-004',
    type: 'system',
    title: 'Welcome to Nini!',
    message: 'Your workspace is set up and ready to go.',
    time: '2026-05-10T08:00:00',
    read: true,
    action: null,
  },
  {
    id: 'notif-005',
    type: 'leave',
    title: 'Leave Approved',
    message: 'Your leave request for Jun 1-5 has been approved.',
    time: '2026-05-11T16:00:00',
    read: true,
    action: '/app/leave',
  },
  {
    id: 'notif-006',
    type: 'team',
    title: 'New Team Member',
    message: 'Yuki Tanaka has joined the Engineering team.',
    time: '2026-05-09T11:00:00',
    read: true,
    action: '/app/employees',
  },
];

export default NOTIFICATIONS;
