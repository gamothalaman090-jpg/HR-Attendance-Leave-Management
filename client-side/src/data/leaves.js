/**
 * Mock Leave Data
 * 
 * Leave requests tied to employee IDs with realistic dates and statuses.
 */

export const LEAVE_REQUESTS = [];

/**
 * Leave balance summary for the current user (Alex Rivera).
 */
export const MY_LEAVE_BALANCE = {
  annual: { total: 20, used: 5, remaining: 15 },
  sick: { total: 12, used: 2, remaining: 10 },
  personal: { total: 7, used: 2, remaining: 5 },
};

export default LEAVE_REQUESTS;
