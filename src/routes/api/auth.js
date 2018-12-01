import express from 'express';
import { requireAuth, requireLogin } from '../../middlewares/auth';
import { notFoundResponse } from '../../utils/response';

const router = express.Router();

function getAuthJSON(req, res) {
    if (!req.user) {
        return notFoundResponse('Unknown user');
    }
    return res.status(200).json(req.user.toAuthJSON());
}

/**
 * Авторизация
 */
router.post('/login', requireLogin, getAuthJSON);

/**
 * Обновление токена
 */
router.get('/keep-token', requireAuth, getAuthJSON);

export default router;
