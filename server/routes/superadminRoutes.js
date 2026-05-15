/**
 * Name: superadminRoutes.js
 * Purpose: Defines the routes for superadmin-specific operations.
 * Dependencies: express
 * Author: Ian
 * Location: server/routes/superadminRoutes.js
 * Created: 2026-05-15
 * Last Updated: 2026-05-15
 */

const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware');
const router = express.Router();
const {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser
} = require('../controllers/superadminController');

router.use(protect);
router.use(authorize('superadmin'));

router.route('/')
    .post(createUser)
    .get(getUsers);

router.route('/:id')
    .get(getUserById)
    .put(updateUser)
    .delete(deleteUser);

module.exports = router;