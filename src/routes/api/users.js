import express from 'express';
import { requireAuth } from '../../middlewares/auth';

const router = express.Router();

/**
 * обновить персональные настройки
 */
router.patch('/me', requireAuth, (req, res) => {});

export default router;
