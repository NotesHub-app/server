import express from 'express';
import { requireLogin, requireRefreshAuth } from '../../middlewares/auth';

import { randomString } from '../../utils/string';

const router = express.Router();

const authFunc = async (req, res) => {
    const { remember } = req.body;

    req.user.refreshTokenCode = randomString(10);
    await req.user.save();

    return res.status(200).json(req.user.toAuthJSON(!!remember));
};

/**
 * Авторизация
 */
router.post('/login', requireLogin, authFunc);

/**
 * Обновление токена
 */
router.post('/keep-token', requireRefreshAuth, authFunc);

export default router;
