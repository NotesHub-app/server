import { check, validationResult } from 'express-validator/check';
import express from 'express';
import User from '../../models/User';
import { randomString } from '../../utils/string';
import { checkValidation } from '../../middlewares/validation';
import { notFoundResponse } from '../../utils/response';

const router = express.Router();

/**
 * Регистрация пользователя
 */
router.post(
    '/',
    [
        // Валидация полей
        check('email').isEmail(),
        check('password').isLength({ min: 8 }),
        checkValidation(),
    ],
    async (req, res) => {
        const { email, password } = req.body;

        const user = new User({
            email,
            password,
            registration: {
                verified: false,
                code: randomString(20),
            },
        });
        await user.save();

        if (process.env.NODE_ENV !== 'test') {
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            // TODO отправить емейл с кодом на емейл пользователя
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        }

        return res.json({ success: true });
    },
);

/**
 * Подтверждение регистрации по коду из письма
 */
router.post(
    '/confirm',
    [
        // Валидация полей
        check('email').isString(),
        check('code').isString(),
    ],
    async (req, res) => {
        // Проверка влалидации
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const { email, code } = req.body;
        const user = await User.findOne({ email, 'registration.code': code });

        if (!user) {
            return notFoundResponse(res, 'Not exist email or code');
        }

        user.registration.verified = true;
        await user.save();

        return res.json({ success: true });
    },
);

export default router;
