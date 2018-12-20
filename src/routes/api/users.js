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
        check('userName')
            .optional()
            .isLength({ min: 3 })
            .withMessage('Имя должно содержать минимум 3 символа'),
        check('uiSettings').optional(),
        check('oldPassword')
            .optional()
            .custom(async (value, { req }) => {
                const validOldPassword = await req.user.comparePassword(value);
                if (!validOldPassword) {
                    throw new Error('Старый пароль неверный');
                }
            }),
        check('newPassword')
            .optional()
            .custom(async (value, { req }) => {
                if (value && !req.body.oldPassword) {
                    throw new Error('Требуется сначала указать старый пароль');
                }
            })
            .isLength({ min: 8 })
            .withMessage('Пароль должен содержать минимум 8 символов'),
        checkValidation(),
    ],
    async (req, res) => {
        const { user } = req;
        const { uiSettings, userName, newPassword } = req.body;

        if (uiSettings) {
            user.updateUiSetting(uiSettings);
        }

        if (newPassword) {
            user.password = newPassword;
        }
        if (userName) {
            user.userName = userName;
        }

        await user.save();

        return res.json({ success: true });
    }
);

export default router;
