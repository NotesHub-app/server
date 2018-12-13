import express from 'express';
import { requireLogin, requireRefreshAuth } from '../../middlewares/auth';

import { randomString } from '../../utils/string';

const router = express.Router();

/**
 * Авторизация
 */
router.post('/login', requireLogin, async (req, res) => {
    req.user.refreshTokenCode = randomString(10);
    await req.user.save();

    return res.status(200).json(req.user.toFullUserJSON());
});

/**
 * Обновление токена
 */
router.post('/refresh-token', requireRefreshAuth, async (req, res) => {
    const withUserData = req.body;
    req.user.refreshTokenCode = randomString(10);
    await req.user.save();

    let result;
    if (withUserData) {
        result = req.user.toFullUserJSON();
    } else {
        result = req.user.toAuthJSON();
    }

    return res.status(200).json(result);
});

export default router;
