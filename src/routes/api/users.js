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
        const { uiSettings, oldPassword, newPassword } = req.body;

        if (uiSettings) {
            user.updateUiSetting(uiSettings);
        }

        if (newPassword) {
            if (!oldPassword) {
            }
            user.password = newPassword;
        }

        await user.save();

        return res.json({ success: true });
    }
);

export default router;
