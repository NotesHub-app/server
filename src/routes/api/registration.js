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
        check('email')
            .isEmail()
            .withMessage('Email адрес имеет не верный формат'),
        check('password')
            .isLength({ min: 8 })
            .withMessage('Пароль должен содержать минимум 8 символов'),
        checkValidation(),
    ],
    async (req, res) => {
        const { email, password } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            // Если пользователь с таким емейлов уже зареген
            if (user.registration.verified) {
                // По мерам безопасности мы не должны говорить, что такой емейл уже есть в системе
                // Делаем простой ответ как будто всё идет по плану
                if (process.env.NODE_ENV === 'production') {
                    req.app.locals.mailService.sendMail({
                        to: email,
                        subject: 'Подтверждение регистрации',
                        text:
                            'Внимание! Вы уже были зарегистрированы ранее! В случае если вы не помните ' +
                            'регистрационные данны - используйте форму восстановления пароля.',
                    });
                }

                return res.json({ success: true });
            }

            // Обновляем код подтверждения
            user.registration.code = randomString(20);
            await user.save();
        } else {
            user = new User({
                email,
                password,
                registration: {
                    verified: false,
                    code: randomString(20),
                },
            });
            await user.save();
        }

        if (process.env.NODE_ENV === 'development') {
            console.info(`:::: REGISTRATION CODE FOR ${user.email}:    ${user.registration.code}`);
        }
        if (process.env.NODE_ENV === 'production') {
            req.app.locals.mailService.sendMail({
                to: email,
                subject: 'Подтверждение регистрации',
                text: `Код подтверждения: ${user.registration.code}`,
            });
        }

        return res.json({ success: true });
    }
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
    }
);

export default router;
