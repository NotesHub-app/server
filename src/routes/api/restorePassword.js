import { check } from 'express-validator/check';
import express from 'express';
import { checkValidation } from '../../middlewares/validation';
import User from '../../models/User';
import { notFoundResponse } from '../../utils/response';

const router = express.Router();

/**
 * восстановление пароля (в теле указываем email)
 */
router.post(
    '/',
    [
        // Валидация параметров
        check('email').isEmail(),
        checkValidation(),
    ],
    async (req, res) => {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            // В данном запросе нужно всё равно отдавать успешный ответ,
            // чтоб не смогли набрутить базу зарегистрированных емейлов
            return res.json({ success: true });
        }

        user.generateRestorePasswordCode();
        await user.save();

        if (process.env.NODE_ENV !== 'test') {
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            // TODO отпавить код на email пользователя
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        }

        return res.json({ success: true });
    },
);

/**
 * восстановление пароля (в теле код из письма и новый пароль пользователя)
 */
router.post(
    '/confirm',
    [
        // Валидация параметров
        check('code').isString(),
        check('password').isLength({ min: 8 }),
        checkValidation(),
    ],
    async (req, res) => {
        const { code, password } = req.body;

        const user = await User.findOne({
            restorePasswordCodes: {
                $elemMatch: {
                    $and: [{ code }, { codeExpire: { $gt: new Date() } }],
                },
            },
        });

        if (!user) {
            return notFoundResponse(res);
        }

        user.password = password;
        await user.save();

        return res.json({ success: true });
    },
);

export default router;
