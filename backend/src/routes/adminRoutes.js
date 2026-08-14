import express from 'express';
import { checkRole } from '../middleware/checkRole.js';
import { getAllUsers, suspendUser, activateUser, getPlatformStats } from '../controllers/adminController.js';

// Admin routes — requires 'admin' role via checkRole middleware
const router = express.Router();

router.use(checkRole(['admin']));

/** GET /api/admin/users - List all registered users */
router.get('/users', getAllUsers);

/** PUT /api/admin/users/:id/suspend - Suspend a user account */
router.put('/users/:id/suspend', suspendUser);

/** PUT /api/admin/users/:id/activate - Reactivate a user account */
router.put('/users/:id/activate', activateUser);

/** GET /api/admin/stats - Get aggregate platform statistics */
router.get('/stats', getPlatformStats);

export default router;
