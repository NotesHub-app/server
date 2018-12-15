import express from 'express';
import { check } from 'express-validator/check';
import { requireAuth } from '../../middlewares/auth';
import { checkValidation } from '../../middlewares/validation';

const router = express.Router();

/**
 * обновить персональные настройки
 */
router.patch(
    '/me',
    [
        requireAuth,

        // Валидация параметров
        check('uiSettings').optional(),
        check('password')
            .optional()
            .isLength({ min: 8 })
            .withMessage('Пароль должен содержать минимум 8 символов'),
        checkValidation(),
    ],
    async (req, res) => {
        const { user } = req;
        const { uiSettings, password } = req.body;

        if (uiSettings) {
            user.updateUiSetting(uiSettings);
        }

        if (password) {
            user.password = password;
        }

        await user.save();

        return res.json({ success: true });
    },
);

export default router;
