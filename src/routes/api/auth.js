import express from 'express';
import { check } from 'express-validator/check';
import { requireGithubAuth, requireGoogleAuth, requireLogin, requireRefreshAuth } from '../../middlewares/auth';
import { randomString } from '../../utils/string';
import { checkValidation } from '../../middlewares/validation';

const router = express.Router();

const loginMethod = async (req, res) => {
    req.user.refreshTokenCode = randomString(10);
    await req.user.save();

    return res.status(200).json(req.user.toFullUserJSON());
};

/**
 * Авторизация
 */
router.post(
    '/login',
    [
        // Валидация параметров
        check('email')
            .not().isEmpty()
            .withMessage('Требуется указать email'),

        check('password')
            .not().isEmpty()
            .withMessage('Требуется указать пароль'),

        checkValidation(),

        requireLogin,
    ],
    loginMethod,
);

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

router.get('/github', requireGithubAuth, loginMethod);
router.get('/google', requireGoogleAuth, loginMethod);

export default router;
