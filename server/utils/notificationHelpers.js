/**
 * Name: notificationHelpers.js
 * Purpose: Batch notification utilities to replace sequential per-user loops.
 * PHASE 2 — NEW FILE
 *
 * The PROBLEM this fixes (N+1 pattern — found in 3 controllers):
 *
 *   // ❌ BEFORE: 1 DB write per user = N round trips
 *   const users = await User.find({ company, role: 'user' }).select('_id');
 *   for (const u of users) {
 *     await createNotification('type', 'Title', 'Msg', u._id, company);
 *   }
 *   // With 10 employees → 10 sequential writes
 *
 *   // ✅ AFTER: 1 DB write total regardless of employee count
 *   await bulkNotify(userIds, { type, title, message, company });
 */

const Notification = require('../models/Notification');

/**
 * Create one notification per recipient in a single insertMany call.
 *
 * @param {string[]|ObjectId[]} recipientIds  - Array of user _id values
 * @param {{ type, title, message, company }} payload
 */
exports.bulkNotify = async (recipientIds, { type, title, message, company }) => {
  if (!recipientIds?.length) return;

  const docs = recipientIds.map((recipientId) => ({
    type,
    title,
    message,
    company: company || 'Default Company',
    recipient: recipientId,
    read: false,
    createdAt: new Date(),
  }));

  try {
    await Notification.insertMany(docs, { ordered: false }); // ordered:false = don't stop on single failure
  } catch (err) {
    console.error('bulkNotify insertMany failed:', err.message);
    // Non-fatal: notifications failing should never crash a business operation
  }
};

/**
 * Create a single notification (unchanged from original createNotification —
 * kept for backward compatibility with single-recipient use cases).
 */
exports.singleNotify = async (type, title, message, recipientId, company) => {
  try {
    await Notification.create({
      type,
      title,
      message,
      recipient: recipientId || null,
      company: company || 'Default Company',
    });
  } catch (err) {
    console.error('singleNotify failed:', err.message);
  }
};
